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
- 8/24: Issuer가 host가 해야될 일 대신 해도 될거 같아서 전부 대신 해주고, 전달한다음 데이터 파기하는 시나리오 제시.
        (Isser가 Host 키쌍 만들어주고 블록체인에 공개키도 올려주고, 서명도 해주고 PrivateKey 전달후 모두 파기하는 식)


# TODO
- 신분증 Form 필요
- FrontEnd 구현
- 시나리오에 대한 상의 필요.
- Verifier - host 간 소통방식에 대한 상의 및 구현 필요.


