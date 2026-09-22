# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json
from dataclasses import dataclass

@allow_storage
@dataclass
class Agreement:
    agreement_id: str
    campaign_name: str
    advertiser: str
    publisher: str
    target_url: str
    ad_identity: str
    requirements_json: str
    escrow_amount: str
    deadline: str
    status: str
    submitted_url: str
    decision: str
    decision_reason: str
    criteria_results_json: str
    evidence_hash: str
    created_at: str
    publisher_claimed: bool
    release_authorized: bool
    settled: bool

class Placemark(gl.Contract):
    counter: str
    agreements: TreeMap[str, Agreement]
    balances: TreeMap[str, str]
    total_escrow_locked: str
    def __init__(self):
        self.counter = "0"
        self.total_escrow_locked = "0"
    @gl.public.write.payable
    def create_agreement(self, campaign_name: str, target_url: str, ad_identity: str, requirements_json: str, deadline: str) -> str:
        assert len(campaign_name) > 0
        assert target_url.startswith("http")
        escrow_value = int(gl.message.value)
        assert escrow_value > 0
        advertiser = gl.message.sender_address.as_hex
        agreement_id = str(self.counter)
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
        self.total_escrow_locked = str(int(self.total_escrow_locked) + escrow_value)
        return agreement_id
    @gl.public.write
    def submit_placement(self, agreement_id: str, placement_url: str) -> None:
        assert agreement_id in self.agreements
        ag = self.agreements[agreement_id]
        sender = gl.message.sender_address.as_hex
        if ag.publisher == "":
            ag.publisher = sender
        ag.submitted_url = str(placement_url)[:500]
        ag.publisher_claimed = True
        ag.status = "PLACEMENT_SUBMITTED"
        self.agreements[agreement_id] = ag
    @gl.public.write
    def evaluate_placement(self, agreement_id: str) -> str:
        assert agreement_id in self.agreements
        ag = self.agreements[agreement_id]
        eval_url = ag.submitted_url if ag.submitted_url != "" else ag.target_url
        ad_identity = ag.ad_identity
        requirements_json = ag.requirements_json
        campaign_name = ag.campaign_name
        try:
            req_list = json.loads(requirements_json)
            req_texts = "\n".join([f"{r['id']}: {r['text']}" for r in req_list])
        except:
            req_texts = requirements_json
            req_list = []
        def leader_fn():
            screenshot = None
            page_text = ""
            render_error = ""
            try:
                screenshot = gl.nondet.web.render(eval_url, mode="screenshot")
            except Exception as e:
                render_error = str(e)[:500]
            try:
                text_content = gl.nondet.web.render(eval_url, mode="text")
                page_text = str(text_content)[:8000]
            except Exception as e:
                page_text = f"Failed: {str(e)[:200]}"
            prompt = f"You are strict ad auditor. Campaign: {campaign_name} Brand: {ad_identity} URL: {eval_url} Requirements: {req_texts} Page text: {page_text} Render: {'screenshot captured' if screenshot is not None else f'failed: {render_error}'} Return ONLY JSON {{decision: COMPLIANT/NON_COMPLIANT/INCONCLUSIVE, confidence: string, reason: string, criteria: [{{id, text, result: PASS/FAIL/INCONCLUSIVE, evidence}}], evidence_hash}}"
            try:
                if screenshot is not None:
                    raw = gl.nondet.exec_prompt(prompt, images=[screenshot])
                else:
                    raw = gl.nondet.exec_prompt(prompt)
            except Exception as e:
                return json.dumps({"decision": "INCONCLUSIVE", "confidence": "0.0", "reason": f"LLM failed: {str(e)[:200]}", "criteria": [], "evidence_hash": "error"}, sort_keys=True)
            cleaned = raw.replace("```json", "").replace("```", "").strip()
            try:
                parsed = json.loads(cleaned)
                return json.dumps(parsed, sort_keys=True)
            except:
                try:
                    start = cleaned.find("{")
                    end = cleaned.rfind("}") + 1
                    sub = cleaned[start:end]
                    parsed = json.loads(sub)
                    return json.dumps(parsed, sort_keys=True)
                except:
                    return json.dumps({"decision": "INCONCLUSIVE", "confidence": "0.0", "reason": f"Parse failed: {cleaned[:200]}", "criteria": [], "evidence_hash": "parse_error"}, sort_keys=True)
        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            try:
                leader_data = json.loads(leader_result.calldata)
                leader_decision = leader_data.get("decision", "")
                if leader_decision not in ["COMPLIANT", "NON_COMPLIANT", "INCONCLUSIVE"]:
                    return False
                validator_json_str = leader_fn()
                validator_data = json.loads(validator_json_str)
                return leader_decision == validator_data.get("decision", "")
            except:
                return False
        result_json_str = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        try:
            result_data = json.loads(result_json_str)
            decision = result_data.get("decision", "INCONCLUSIVE")
            reason = result_data.get("reason", "")[:1000]
            criteria_json = json.dumps(result_data.get("criteria", []))
            evidence_hash = result_data.get("evidence_hash", "")[:200]
        except Exception as e:
            decision = "INCONCLUSIVE"
            reason = f"Failed to parse: {str(e)}"
            criteria_json = "[]"
            evidence_hash = "error"
        ag = self.agreements[agreement_id]
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
    @gl.public.view
    def get_agreement(self, agreement_id: str) -> str:
        assert agreement_id in self.agreements
        ag = self.agreements[agreement_id]
        return json.dumps({
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
        })
    @gl.public.view
    def get_all_agreements(self) -> str:
        result = []
        for k in self.agreements:
            ag = self.agreements[k]
            result.append({
                "agreement_id": ag.agreement_id,
                "campaign_name": ag.campaign_name,
                "status": ag.status,
                "decision": ag.decision,
                "target_url": ag.target_url,
                "escrow_amount": ag.escrow_amount,
            })
        return json.dumps(sorted(result, key=lambda x: int(x["agreement_id"]), reverse=True))
    @gl.public.view
    def get_agreement_count(self) -> str:
        return str(self.counter)
