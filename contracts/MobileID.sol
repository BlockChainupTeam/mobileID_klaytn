pragma solidity ^0.4.24;

contract MobileID {

    struct keyRing{
        bool joined;
        string publicKey;
    }

    mapping(address => keyRing) public pks;     // 공개키보관
    uint public hostCount; //회원 수 카운팅
    bool private isIssuerKey = false;
    address public owner;

    constructor() public {
        owner = msg.sender;
    }

    function setIssuerPublicKey(string _issuerPublicKey) public {
        pks[owner].publicKey = _issuerPublicKey;
        isIssuerKey = true;
    }

    function isIssuerPublicKey() public view returns (bool) {
        return isIssuerKey;
    }

    function setPublicKey(address _addr, string _publicKey) public {
        pks[_addr].joined = true;
        pks[_addr].publicKey = _publicKey;
    }

    function getIssuerPublicKey() public returns (string) {
        return pks[owner].publicKey;
    }

    function getPublicKey(address addr) public returns (string) {
        return pks[addr].publicKey;
    }

//    function removeHost(address addr) public {
//        pks[addr].joined = false;
//        pks[addr].hostKey = "";
//        pks[addr].issuerKey = "";
//        hostCount--;
//    } //초기화
//
//    function getHost(address addr) public view returns (bool joined, string hostKey, string issuerKey) {
//        joined = pks[addr].joined;
//        hostKey = pks[addr].hostKey;
//        issuerKey = pks[addr].issuerKey;
//    }
//    function getHostCount() public view returns (uint count) {
//        count = hostCount;
//    } //회원수출력
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

    function deposit() public payable {
        require(msg.sender == owner);
    }

    function transfer(uint _value) public returns (bool) {
        require(getBalance() >= _value);
        msg.sender.transfer(_value);
        return true;
    }
}
