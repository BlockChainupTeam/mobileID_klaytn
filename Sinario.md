# User
- Issuer
    > 계정 인증을 진행하는 User <br>
        각 계정이 올바른 정보를 입력하였는지 확인한 후 서명 및 암호화 진행 
- Host
    > 자신의 신원 정보를 Verifier에게 인증하고자 하는 User <br>
        자신의 정보를 Issuer에게 전달(오프라인)하여 암호화된 파일을 얻고, 이를 사용하여 Verifier에게 자신의 신원을 인증받을 수 있다.  
- Verifier
    > 자신의 서비스를 이용하고자 하는 Host의 정보를 확인하고자 하는 User <br>
        Host가 암호화된 자신의 정보를 넘겨주면 Blockchain에서 암호를 받아 host의 신원을 확인할 수 있다.
             
             
# Senario #0 - 공통: Login session
1. https://wallet.klaytn.com/ 에서 wallet을 발급받은 것을 전제로 진행 (추후 변경 가능 - 발급 받을 수 있도록)
    - Keystore file
    1. 로그인 선택 후 키스토어 파일 입력
    2. 해당 키스토어 파일에 맞는 비밀번호 입력
    
    - Private Key 입력 (미구현)
    1. 로그인 선택 후 private key 입력
   
2. 이후 로그인한 계정에 따라 Issuer와 Host, Verifier로 나뉨.
     
# Senario #1 - Issuer (DONE)
- 각 신분증에 암호화되지 않은 User type 기입되어 있음 O
1. User의 정보를 오프라인으로 받는다. O
2. User의 정보를 입력한다. O
3. Issuer Private Key를 입력하여 User의 정보를 암호화한다. O
4. Issuer Public Key를 Blockchain에 저장한다. O
5. Host Private Key를 입력하여 User의 정보를 다시 한번 암호화한다. O
6. Host Public Key를 Blockchain의 Host에 해당하는 주소에 저장한다. O
7. 이중으로 암호화된 User의 정보(신분증)와 User의 PirvateKey를 User에게 전달한다. O
    > 유저의 IDCard = (UserType + Data + Keystore) 로 한번에 신분증으로 발급, 유저는 IDCard로 로그인, 신분확인 모두 가능하다.
8. User에게 전달한 이후에는 모든 User관련 데이터 (신원정보, keystore, 암호화된 파일, User의 키쌍) 을 파기한다.

# Senario #2 - Host
- Issuer로부터 신분증을 받지 않은 경우 로그인 할 수 없음
    > Issuer에게 신분증을 발급받으라는 알람 표시 
1. 신분증 등록하기 (최초 로그인시 사용)
    > Host는 최초 로그인 시 자신의 신분증을 계정에 등록한다.
    1. '신분증 등록하기' 버튼 선택
    2. Issuer에게 받은 신분증 선택
    3. 최초인 경우(사용자 서명이 없는 경우) 서명을 추가하게 됨

 ================================ 이과정을 생략하여 시나리오 변경안=====
    1.Issuer에게 신분증을 발급받는 즉시 사용이 가능하다. (서명과 키쌍도 전달받음)
    
    ... PrivateKey와 이중서명된 Data파일에 대한 간수는 본인이 책임져야한다.
    (AES암호화 등 추가 암호화가 필요할듯하고 저장소에 대한 최소 보안 확보 필요.)
 
2. 인증 내역 확인하기
    1. '인증내역 확인하기' 버튼 선택
    2. 자신의 신분증을 확인한 내역 확인
        > (미정) 사용자의 공개키 트랜잭션 활용 / 받는 transaction, 확인완료 transaction

3. 신분증 삭제하기
    1. '신분증 삭제하기' 버튼 선태
    2. 최종 확인 후 신분증 제거  
        > (미정) Host 서명 제거? Issuer 서명 제거? 방법필요
        >> 그냥 발급받은 신분증 파일 파기하면 끝.
        >>> 블록체인에 남는건 공개키 뿐인데 이거는 삭제해도 안해도 신원정보 유출에 아무 관련 없음.

# Senario #3 - Verifier
1. Host 신원 확인하기
    1. '신원 확인하기' 버튼 선택
    2. Host에게 신분증을 전달받음
        > 신분증 전달받을 방법 필요 (qrcode plugin 있음) https://web-inf.tistory.com/15
        >> 신분증을 전달받는 방법 잘 생각해야할듯.
        >>> 공개키는 블록체인에 공개되어있기 때문에 신분증이 중간에 탈취당하면 위험.
    3. Blockchain에 있는 Host의 공개키를 통해 Host의 소유권을 확인
    4. Issuer의 공개키를 통해 Host 신분증을 복호화하여 내용을 얻음과 동시에 신원정보에 대해 검증받음.
    5. Host의 각종 신원정보 확인가능 및 소유권, 실존정보검증 모두 완료.
    
# 신분증 Form (미정)
~~~
신분증 Form:
{
UserType: Issuer | Host | Verifier,
HostData: hostData,
 // 이후 추가 가능
 + Sign: IssuerSign?
 + Sign: HostSign 
}
~~~
