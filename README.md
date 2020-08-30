# 실행방법
현재 리포 받은 후 
> npm install <br>
> truffle-config.js에서 PrivateKey 변경 <br>
> npm run dev //실행

# 주요 버전
- node.js: 10.15.3
- npm: 6.4.1
- caver-js: v1.5.2-rc.1
- truffle: 4.1.15
- solidity: 0.4.25
- using webpack


# 진행과정
- 8/2: 클레이튼으로 제작환경 옮김
- ~ 8/6: 클레이튼 실습 진행(Addition-Game), 실습 기반으로 제작 시작
- ~ 8/9: 로그인 세션, 호스트 데이터 컨트랙트 구현
- 8/14: crypto session 구현 시작 
- 8/18: Repository 옮김
- 8/20: Issuer - host 시나리오 완성, 개인키/공개키 일부 완성, rsa.js 일부수정
- 8/24: Issuer가 host가 해야할 서명, 암호화 등을 대신 진행함, 전달 이후 데이터 파기하는 시나리오 제시.
        (Isser가 Host의 키쌍을 만들어주고 블록체인에 공개키를 올리고 서명또한 진행한 뒤 PrivateKey 전달, 이후에 모두 파기하는 식)
        필요없는 코드 지우고 파일 저장 조금 수정했음.(파일형식, JSON 저장시 들여쓰기), RSA에서 getkey시 새로생성하게 수정
- 8/26: 현재 진행상황 확인 / 시나리오 전면 재검토 후 추가 및 수정 진행
- 8/27: 시나리오 개편 - 각종 이슈 확인 및 진행상황 업데이트
- 8/30: Host - Issuer간 통신 업데이트 ( User에서 키스토어 발급 > Issuer암호화 진행 > User가 직접 개인키로 서명)
- 8/31: Host와 Issuer의 암호화 및 IDCard 갱신 부분 구현하였음


# TODO
- 신분증 Form 필요
- Host-Verifier간 통신 - 각 유저에 대한 transaction 구현
- Host-Verifier간 통신 - ID Card 전달 방법 논의 필요
- FrontEnd 구현
- CL Algorithm 확인 후 구현

- 서명하는거 구현해야됨 (현재 대충 임시서명이라는 값을 넣게해놈) 
- 수수료위임 트랜잭션 할지말지 고려해야될듯 (수수료 위임 사용시, 대기하고 처리하는거도 만들어야됨)
  그냥 수수료낼수있을만큼 klay 떼주는거로 일단 하는게 나을듯..
- 현재 IDCard파일이 3개 생성되는 방식인데 이거 FileSystem으로 바꿔서 로컬 파일 수정할 수 있게 해야될듯.
  그 방법이 그냥 JS에서는 보안상 불가능하다고 찾았는데, Node.js 찾아보니까 있는거같기도하고..
