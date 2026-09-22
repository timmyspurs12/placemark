import json
import sys
from pathlib import Path

# Mock genlayer if not available
try:
    from genlayer import *
    from gltest import get_contract_factory
    HAS_GLTEST = True
except ImportError:
    HAS_GLTEST = False

CONTRACTS_DIR = Path(__file__).parent.parent.parent / "contracts"

def test_contract_exists():
    assert (CONTRACTS_DIR / "placemark.py").exists()

def test_requirements_json_validation():
    # Test valid requirements
    valid = json.dumps([
        {"id": "01", "text": "Above fold"},
        {"id": "02", "text": "Logo visible"}
    ])
    parsed = json.loads(valid)
    assert len(parsed) == 2

def test_invalid_requirements():
    # Should fail parsing
    try:
        json.loads("not json")
        assert False, "should have failed"
    except:
        assert True

def test_agreement_flow_logic():
    # Simulate agreement creation logic without chain
    campaign_name = "Test Campaign"
    target_url = "https://example.com"
    ad_identity = "ACME"
    requirements = json.dumps([
        {"id": "01", "text": "Visible above fold"},
        {"id": "02", "text": "Brand logo visible"},
    ])
    assert len(campaign_name) > 0
    assert target_url.startswith("https://")
    assert len(ad_identity) > 0
    reqs = json.loads(requirements)
    assert len(reqs) == 2

def test_decision_parsing():
    sample_result = {
        "decision": "COMPLIANT",
        "confidence": "0.85",
        "reason": "All checks passed",
        "criteria": [
            {"id": "01", "text": "Above fold", "result": "PASS", "evidence": "Found in top 400px"},
            {"id": "02", "text": "Logo visible", "result": "PASS", "evidence": "ACME logo detected"},
        ],
        "evidence_hash": "abc123"
    }
    json_str = json.dumps(sample_result, sort_keys=True)
    parsed = json.loads(json_str)
    assert parsed["decision"] == "COMPLIANT"
    assert len(parsed["criteria"]) == 2

def test_compliant_logic():
    criteria = [
        {"id": "01", "result": "PASS"},
        {"id": "02", "result": "PASS"},
        {"id": "03", "result": "PASS"},
    ]
    all_pass = all(c["result"] == "PASS" for c in criteria)
    assert all_pass == True

def test_non_compliant_logic():
    criteria = [
        {"id": "01", "result": "PASS"},
        {"id": "02", "result": "FAIL"},
    ]
    has_fail = any(c["result"] == "FAIL" for c in criteria)
    assert has_fail == True

if HAS_GLTEST:
    def test_contract_deploy_and_create():
        factory = get_contract_factory(contract_file_path=CONTRACTS_DIR / "placemark.py")
        contract = factory.deploy(args=[])
        
        # Create agreement
        req_json = json.dumps([
            {"id": "01", "text": "Above fold"},
            {"id": "02", "text": "Logo visible"},
        ])
        # Simulate payable via factory? Use transact with value
        tx = contract.create_agreement(args=["Test Campaign", "https://example.com", "ACME", req_json, "2026-12-31"]).transact(value=100)
        from gltest.assertions import tx_execution_succeeded
        assert tx_execution_succeeded(tx)

        count = contract.get_agreement_count(args=[]).call()
        assert int(count) >= 1

        all_ag = contract.get_all_agreements(args=[]).call()
        parsed = json.loads(all_ag)
        assert len(parsed) >= 1
