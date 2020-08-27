pragma solidity ^0.4.24;

contract MobileID {

    struct keyRing{
        bool joined;
        string publicKey;
    }

    mapping(address => keyRing) public pks;     // 공개키보관
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

    function getPublicKey(address _addr) public returns (string) {
        return pks[_addr].publicKey;
    }

    function isPublicKey (address _addr) public returns (bool) {
        return pks[_addr].joined;
    }

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
