pragma solidity ^0.4.24;

contract MobileID {

    struct publicKey{
        bool joined;
        string hostKey;
        string issuerKey;
    } //일단 IssuerKey - Host 1:1대응하는것으로 가정

    mapping(address => publicKey) public pks;     // 공개키보관
    uint public hostCount; //회원 수 카운팅
    address public owner;

    constructor() public {
        owner = msg.sender;
        hostCount = 0;
    }
    function setHost(address addr, string hostKey, string issuerKey) external {
        pks[addr].joined = true;
        pks[addr].hostKey = hostKey;
        pks[addr].issuerKey = issuerKey;
        hostCount++;
    }
    function removeHost(address addr) external {
        pks[addr].joined = false;
        pks[addr].hostKey = "";
        pks[addr].issuerKey = "";
        hostCount--;
    } //초기화
    function getHost(address addr) public view returns (bool joined, string hostKey, string issuerKey) {
        joined = pks[addr].joined;
        hostKey = pks[addr].hostKey;
        issuerKey = pks[addr].issuerKey;
    }
    function getHostCount() public view returns (uint count) {
        count = hostCount;
    } //회원수출력
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
