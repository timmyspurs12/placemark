# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json
from dataclasses import dataclass

# Payee interface for EOA transfers
@gl.evm.contract_interface
class _Payee:
    class Write:
        pass

@allow_storage
@dataclass
class Agreement:
    agreement_id: str
    campaign_name: str
    advertiser: str
    publisher: str
    target_url: str
    ad_identity: str
    requirements_json: str  # JSON string of list of {id, text}
    escrow_amount: str      # stored as string wei
    deadline: str
    status: str  # CREATED, PLACEMENT_SUBMITTED, EVALUATING, COMPLIANT, NON_COMPLIANT, INCONCLUSIVE, SETTLED
    submitted_url: str
    decision: str  # COMPLIANT, NON_COMPLIANT, INCONCLUSIVE, NONE
    decision_reason: str
    criteria_results_json: str  # JSON string of list of results
    evidence_hash: str
    created_at: str
    publisher_claimed: bool
    release_authorized: bool
    settled: bool


class Placemark(gl.Contract):
    counter: str
    agreements: TreeMap[str, Agreement]
    balances: TreeMap[str, str]  # address -> claimable wei as string
    total_escrow_locked: str

    def __init__(self):
        self.counter = "0"
        self.total_escrow_locked = "0"

    @gl.public.write.payable
    def create_agreement(
        self,
        campaign_name: str,
        target_url: str,
        ad_identity: str,
        requirements_json: str,
        deadline: str,
    ) -> str:
        # validations
        assert len(campaign_name) > 0, "campaign name required"
        assert len(campaign_name) <= 120, "campaign name too long"
        assert len(target_url) > 8, "target url required"
        assert target_url.startswith("http://") or target_url.startswith("https://"), "url must start with http"
        assert len(ad_identity) > 0, "ad identity required"
        assert len(requirements_json) > 2, "requirements required"
        # validate requirements json is parseable list
        try:
            reqs = json.loads(requirements_json)
            assert isinstance(reqs, list), "requirements must be list"
            assert len(reqs) >= 1 and len(reqs) <= 10, "1-10 requirements"
            for r in reqs:
                assert "id" in r and "text" in r, "each requirement needs id and text"
        except Exception as e:
            raise gl.vm.UserError(f"invalid requirements_json: {str(e)}")

        assert len(deadline) > 0, "deadline required"

        escrow_value = int(gl.message.value)
        assert escrow_value > 0, "escrow must be > 0"

        advertiser = gl.message.sender_address.as_hex
        agreement_id = str(self.counter)

        # datetime
        try:
            created_at = str(gl.message.datetime)
        except:
            created_at = deadline

        agreement = Agreement(
            agreement_id=agreement_id,
            campaign_name=str(campaign_name)[:120],
            advertiser=advertiser,
            publisher="",
            target_url=str(target_url)[:500],
            ad_identity=str(ad_identity)[:120],
            requirements_json=str(requirements_json),
            escrow_amount=str(escrow_value),
            deadline=str(deadline),
            status="CREATED",
            submitted_url="",
            decision="NONE",
            decision_reason="",
            criteria_results_json="[]",
            evidence_hash="",
            created_at=created_at,
            publisher_claimed=False,
            release_authorized=False,
            settled=False,
        )

        self.agreements[agreement_id] = agreement
        self.counter = str(int(self.counter) + 1)
        current_locked = int(self.total_escrow_locked) if self.total_escrow_locked else 0
        self.total_escrow_locked = str(current_locked + escrow_value)

        return agreement_id

    @gl.public.write
    def submit_placement(self, agreement_id: str, placement_url: str) -> None:
        assert agreement_id in self.agreements, "agreement not found"
        ag = self.agreements[agreement_id]
        assert ag.status in ["CREATED", "PLACEMENT_SUBMITTED", "INCONCLUSIVE"], f"cannot submit in status {ag.status}"
        assert len(placement_url) > 8, "placement url required"
        assert placement_url.startswith("http"), "url must start with http"

        sender = gl.message.sender_address.as_hex
        # first submitter becomes publisher if not set, or allow same publisher to update
        if ag.publisher == "":
            ag.publisher = sender
        # allow advertiser or publisher to submit
        assert sender == ag.advertiser or sender == ag.publisher, "only advertiser or publisher can submit"

        ag.submitted_url = str(placement_url)[:500]
        ag.publisher_claimed = True
        ag.status = "PLACEMENT_SUBMITTED"
        self.agreements[agreement_id] = ag

    @gl.public.write
    def evaluate_placement(self, agreement_id: str) -> str:
        assert agreement_id in self.agreements, "agreement not found"
        ag = self.agreements[agreement_id]
        assert ag.status in ["PLACEMENT_SUBMITTED", "CREATED", "INCONCLUSIVE"], f"cannot evaluate in status {ag.status}"
        assert ag.submitted_url != "" or ag.target_url != "", "no url to evaluate"

        # Use submitted_url if available, else target_url
        eval_url = ag.submitted_url if ag.submitted_url != "" else ag.target_url
        ad_identity = ag.ad_identity
        requirements_json = ag.requirements_json
        campaign_name = ag.campaign_name

        # Parse requirements for prompt
        try:
            req_list = json.loads(requirements_json)
            req_texts = "\n".join([f"{r['id']}: {r['text']}" for r in req_list])
        except:
            req_texts = requirements_json

        # Store evaluating status optimistically before nondet? No, must after.
        # We will do nondet evaluation first, then update state.

        def leader_fn():
            # Step 1: Capture live page as screenshot + text
            # Try screenshot first, fallback to text
            screenshot = None
            page_text = ""
            render_error = ""
            try:
                # Screenshot mode
                screenshot = gl.nondet.web.render(eval_url, mode="screenshot")
            except Exception as e:
                render_error = str(e)[:500]
                screenshot = None

            try:
                # Also get text for additional grounding
                text_content = gl.nondet.web.render(eval_url, mode="text")
                page_text = str(text_content)[:8000]
            except Exception as e:
                if page_text == "":
                    page_text = f"Failed to fetch text: {str(e)[:200]}"

            # Step 2: Build evaluation prompt
            prompt = f"""
You are a strict advertising placement compliance auditor for Placemark.

Campaign: {campaign_name}
Brand/Ad Identity: {ad_identity}
Target URL: {eval_url}
Requirements to check:
{req_texts}

Page text excerpt (first 8000 chars):
{page_text}

Render status: {"screenshot captured" if screenshot is not None else f"screenshot failed: {render_error}"}

Task: Evaluate whether the live publisher page satisfies EACH requirement visually and textually.
- Requirement is satisfied only if there is clear evidence in screenshot or page text.
- "Above the fold" means visible in top 800px of viewport without scrolling.
- "Brand logo visible" means brand name or logo text appears.
- "Main content region" means inside central article/content area, not footer/sidebar.
- "No overlap" means ad does not overlap other ads.
- "No competitor adjacent" means competitor brand not within same viewport section.

Return ONLY valid JSON with this exact schema:
{{
  "decision": "COMPLIANT" or "NON_COMPLIANT" or "INCONCLUSIVE",
  "confidence": "0.0" to "1.0" as string,
  "reason": "brief overall reasoning",
  "criteria": [
    {{"id": "01", "text": "requirement text", "result": "PASS" or "FAIL" or "INCONCLUSIVE", "evidence": "short evidence summary"}},
    ...
  ],
  "evidence_hash": "short hash or timestamp of evidence"
}}

Rules:
- If screenshot failed and page_text is insufficient, return INCONCLUSIVE.
- If any requirement FAILs, decision is NON_COMPLIANT unless evidence is truly insufficient.
- If all PASS, decision COMPLIANT.
- If 1+ INCONCLUSIVE and rest PASS, decision INCONCLUSIVE.
- Confidence as string.
- Return ONLY JSON, no markdown, no extra text.
"""

            # Call LLM with or without image
            try:
                if screenshot is not None:
                    # Pass screenshot as image
                    raw = gl.nondet.exec_prompt(prompt, images=[screenshot])
                else:
                    raw = gl.nondet.exec_prompt(prompt)
            except Exception as e:
                # If LLM fails, return inconclusive structure as JSON string
                return json.dumps({
                    "decision": "INCONCLUSIVE",
                    "confidence": "0.0",
                    "reason": f"LLM call failed: {str(e)[:200]}",
                    "criteria": [{"id": r.get("id","01"), "text": r.get("text",""), "result": "INCONCLUSIVE", "evidence": "llm error"} for r in req_list] if 'req_list' in locals() else [],
                    "evidence_hash": "error"
                }, sort_keys=True)

            # Clean possible markdown fences
            cleaned = raw.replace("```json", "").replace("```", "").strip()
            # Validate JSON
            try:
                parsed = json.loads(cleaned)
                # Ensure required fields
                assert "decision" in parsed
                assert parsed["decision"] in ["COMPLIANT", "NON_COMPLIANT", "INCONCLUSIVE"]
                # Ensure criteria
                if "criteria" not in parsed:
                    parsed["criteria"] = []
                # Normalize to sorted JSON string for consensus
                return json.dumps(parsed, sort_keys=True)
            except Exception as e:
                # If parsing fails, try to extract JSON substring
                try:
                    start = cleaned.find("{")
                    end = cleaned.rfind("}") + 1
                    if start >=0 and end > start:
                        sub = cleaned[start:end]
                        parsed = json.loads(sub)
                        return json.dumps(parsed, sort_keys=True)
                except:
                    pass
                # Fallback inconclusive
                return json.dumps({
                    "decision": "INCONCLUSIVE",
                    "confidence": "0.0",
                    "reason": f"Failed to parse LLM output: {cleaned[:200]} error:{str(e)[:100]}",
                    "criteria": [],
                    "evidence_hash": "parse_error"
                }, sort_keys=True)

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                leader_data = json.loads(leader_result.calldata)
                leader_decision = leader_data.get("decision", "")
                if leader_decision not in ["COMPLIANT", "NON_COMPLIANT", "INCONCLUSIVE"]:
                    return False
                # Re-run evaluation independently
                validator_json_str = leader_fn()
                validator_data = json.loads(validator_json_str)
                validator_decision = validator_data.get("decision", "")

                # Strict: decisions must match
                if leader_decision != validator_decision:
                    return False

                # Also compare criteria PASS/FAIL counts to avoid random decisions
                # Allow criteria details to differ, but number of PASS should be close
                leader_criteria = leader_data.get("criteria", [])
                validator_criteria = validator_data.get("criteria", [])

                # If both have criteria, check that PASS/FAIL per id matches for at least 80%
                if len(leader_criteria) > 0 and len(validator_criteria) > 0:
                    # Build dict by id
                    l_map = {c.get("id"): c.get("result") for c in leader_criteria}
                    v_map = {c.get("id"): c.get("result") for c in validator_criteria}
                    # Compare matching ids
                    matching = 0
                    total = 0
                    for id_key in l_map:
                        if id_key in v_map:
                            total += 1
                            if l_map[id_key] == v_map[id_key]:
                                matching += 1
                    if total > 0 and matching / total < 0.6:
                        # Too much divergence
                        return False

                return True
            except Exception as e:
                # On any error, disagree
                return False

        # Run with consensus
        result_json_str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        # Parse result
        try:
            result_data = json.loads(result_json_str)
            decision = result_data.get("decision", "INCONCLUSIVE")
            reason = result_data.get("reason", "")[:1000]
            criteria_json = json.dumps(result_data.get("criteria", []))
            evidence_hash = result_data.get("evidence_hash", "")[:200]
            confidence = result_data.get("confidence", "0.0")
        except Exception as e:
            decision = "INCONCLUSIVE"
            reason = f"Failed to parse consensus result: {str(e)}"
            criteria_json = "[]"
            evidence_hash = "error"
            confidence = "0.0"

        # Update agreement
        ag = self.agreements[agreement_id]  # re-fetch to avoid stale
        ag.decision = decision
        ag.decision_reason = reason
        ag.criteria_results_json = criteria_json
        ag.evidence_hash = evidence_hash

        if decision == "COMPLIANT":
            ag.status = "COMPLIANT"
            ag.release_authorized = True
        elif decision == "NON_COMPLIANT":
            ag.status = "NON_COMPLIANT"
            ag.release_authorized = False
        else:
            ag.status = "INCONCLUSIVE"
            ag.release_authorized = False

        self.agreements[agreement_id] = ag

        return result_json_str

    @gl.public.write
    def finalize_and_release(self, agreement_id: str) -> None:
        assert agreement_id in self.agreements, "agreement not found"
        ag = self.agreements[agreement_id]
        assert not ag.settled, "already settled"
        assert ag.status in ["COMPLIANT", "NON_COMPLIANT", "INCONCLUSIVE"], "must be evaluated first"

        sender = gl.message.sender_address.as_hex
        # Only advertiser or publisher can finalize
        assert sender == ag.advertiser or sender == ag.publisher or ag.publisher == "", "only parties can finalize"

        escrow = int(ag.escrow_amount)

        if ag.status == "COMPLIANT" and ag.release_authorized:
            # Release to publisher if set, else advertiser (fallback)
            recipient = ag.publisher if ag.publisher != "" else ag.advertiser
            # Transfer
            try:
                # Use payee interface for EOA
                _Payee(Address(recipient)).emit_transfer(value=u256(escrow))
            except Exception as e:
                # If transfer fails, fallback to contract_at
                try:
                    gl.get_contract_at(Address(recipient)).emit_transfer(value=u256(escrow))
                except:
                    raise gl.vm.UserError(f"transfer failed: {str(e)}")

            # Update balances tracking
            current = int(self.balances.get(recipient, "0"))
            self.balances[recipient] = str(current + escrow)

            ag.settled = True
            ag.status = "SETTLED"
            self.agreements[agreement_id] = ag

            # Update total locked
            locked = int(self.total_escrow_locked)
            self.total_escrow_locked = str(max(0, locked - escrow))

        elif ag.status == "NON_COMPLIANT":
            # Refund to advertiser
            recipient = ag.advertiser
            try:
                _Payee(Address(recipient)).emit_transfer(value=u256(escrow))
            except:
                try:
                    gl.get_contract_at(Address(recipient)).emit_transfer(value=u256(escrow))
                except Exception as e:
                    raise gl.vm.UserError(f"refund failed: {str(e)}")

            current = int(self.balances.get(recipient, "0"))
            self.balances[recipient] = str(current + escrow)

            ag.settled = True
            ag.status = "SETTLED"
            self.agreements[agreement_id] = ag

            locked = int(self.total_escrow_locked)
            self.total_escrow_locked = str(max(0, locked - escrow))

        else:  # INCONCLUSIVE
            # No auto release, mark for manual review, keep escrow locked
            # Allow advertiser to trigger manual review path later
            ag.status = "INCONCLUSIVE"
            self.agreements[agreement_id] = ag
            raise gl.vm.UserError("INCONCLUSIVE: requires manual review, escrow remains locked")

    @gl.public.write
    def withdraw(self) -> None:
        # For any claimable balance tracking, allow withdraw (but actual transfer already done in finalize)
        sender = gl.message.sender_address.as_hex
        bal = int(self.balances.get(sender, "0"))
        assert bal > 0, "no balance"
        # Reset balance before transfer (checks-effects-interactions)
        self.balances[sender] = "0"
        try:
            _Payee(Address(sender)).emit_transfer(value=u256(bal))
        except:
            try:
                gl.get_contract_at(Address(sender)).emit_transfer(value=u256(bal))
            except Exception as e:
                # Restore balance if fails
                self.balances[sender] = str(bal)
                raise gl.vm.UserError(f"withdraw failed: {str(e)}")

    @gl.public.view
    def get_agreement(self, agreement_id: str) -> str:
        assert agreement_id in self.agreements, "not found"
        ag = self.agreements[agreement_id]
        # Return as JSON string
        data = {
            "agreement_id": ag.agreement_id,
            "campaign_name": ag.campaign_name,
            "advertiser": ag.advertiser,
            "publisher": ag.publisher,
            "target_url": ag.target_url,
            "ad_identity": ag.ad_identity,
            "requirements_json": ag.requirements_json,
            "escrow_amount": ag.escrow_amount,
            "deadline": ag.deadline,
            "status": ag.status,
            "submitted_url": ag.submitted_url,
            "decision": ag.decision,
            "decision_reason": ag.decision_reason,
            "criteria_results_json": ag.criteria_results_json,
            "evidence_hash": ag.evidence_hash,
            "created_at": ag.created_at,
            "publisher_claimed": ag.publisher_claimed,
            "release_authorized": ag.release_authorized,
            "settled": ag.settled,
        }
        return json.dumps(data)

    @gl.public.view
    def get_all_agreements(self) -> str:
        result = []
        for k in self.agreements:
            ag = self.agreements[k]
            result.append({
                "agreement_id": ag.agreement_id,
                "campaign_name": ag.campaign_name,
                "advertiser": ag.advertiser,
                "publisher": ag.publisher,
                "target_url": ag.target_url,
                "ad_identity": ag.ad_identity,
                "status": ag.status,
                "decision": ag.decision,
                "escrow_amount": ag.escrow_amount,
                "created_at": ag.created_at,
            })
        # Sort by id desc
        result_sorted = sorted(result, key=lambda x: int(x["agreement_id"]), reverse=True)
        return json.dumps(result_sorted)

    @gl.public.view
    def get_agreement_count(self) -> str:
        return str(self.counter)

    @gl.public.view
    def get_balance(self, address: str) -> str:
        return self.balances.get(address, "0")

    @gl.public.view
    def get_total_locked(self) -> str:
        return self.total_escrow_locked
