pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

contract MobileID {


     struct Info{
        string name;
        string date;
        string addr;
    }
        
    struct keyRing{
        bool joined;
        string publicKey;
    }
       
    Info[] HostVerficationInfos;
    uint8 public InfoSize;

    mapping ( address => keyRing ) public pks;     // 공개키보관

    mapping ( address => Info[]) public records;


    bool private isIssuerKey = false;
    address public owner;

    constructor() public {
        owner = msg.sender;
    }

    //인증 내역 저장  이름 , 날짜 , 저장할주소 ,본인주소
    function setCertificationInfo(string name,string date,string _useraddr,address _addr) public{
     records[_addr].push(Info(name,date,_useraddr));
     InfoSize++;
    }
    
    function getCertificationInfo(address _addr) public returns(Info[]) {
     return records[_addr];
    }
    
    function getCertificationSize() public returns(uint8){
        return InfoSize;
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

    function deletePublicKey (address _addr) public {
        delete pks[_addr];
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