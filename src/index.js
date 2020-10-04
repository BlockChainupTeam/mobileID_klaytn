/**
 * ######## 수정내역 ######### - 로그 계속 남겨주세요
 * 08/09 - 곽현준
 * - host의 주민등록번호 영역 id_num -> id_number로 변경 (contract와 동기)
 * - hostdata 저장하는 sessionStorage 제거
 * - 코드 깔끔히 정리
 * - start 정리
 *
 *
 * ######## 주의사항 ########
 * - 올리기 전에 불필요한 console.log() 지워주세요.
 */

import Caver from "caver-js";
import {Spinner} from "spin.js";
import RSA from "./rsa";

const jsQR = require('jsqr');

const config = {
  rpcURL: 'https://api.baobab.klaytn.net:8651'
}
const cav = new Caver(config.rpcURL); // instance
const agContract = new cav.klay.Contract(DEPLOYED_ABI, DEPLOYED_ADDRESS);

const App = {
  auth: {
    accessType: 'keystore',
    keystore: '',
    password: '',
    privateKey: '',
    address: '',
    name: '',
    //개인주소 추가
  },

  user:{
    password: '',
    userType: '',
    name: '',
    id_number: '',
    phone: '',
    qrcode:''
  },

  IDCard: {
    UserType: '',
    Cipher: '',
    Keystore: '',
    IssuerSign: '',
    UserSign: ''
  },

  cipherHostData: '',
  hostaddress:'',


  /**
   * Start에서 변경할때 꼭 확인
   */
  start: async function () {
    const walletFromSession = sessionStorage.getItem('walletInstance'); // 사용자의 키값을 불러서 상수로 저장

    // 1. Session Loading - key Load
    if (walletFromSession) {

      try{
        // cav.klay.accounts.wallet이 현재 진행하는 계정 정보
        cav.klay.accounts.wallet.add(JSON.parse(walletFromSession)); // cav-wallet에 해당 계정 정보를 다시 넣음

        this.auth.address = JSON.parse(walletFromSession).address;

        // UI 통일시킬 필요 있을듯
        await this.changeUI(JSON.parse(walletFromSession));

      } catch (e) { // 유효한 계정 정보가 아닌경우
        sessionStorage.removeItem('walletInstance'); // session에서 정보 지움
      }
    }
  },


  /**
   * << UI >>
   * User Type에 따라 분기
   * @param walletInstance
   * @returns {Promise<void>}
   */
  changeUI: async function (walletInstance) {
    $('#loginModal').modal('hide');
    $('#userlogin').hide();
    $('#logout').show();

    $('#host_session_out').show(); //TODO: 임시로 만들어놓음

    this.user.userType = sessionStorage.getItem("UserType");

    // issuer가 접속한 경우에만 호스트 데이터 입력할 수 있도록
    if (await this.callOwner() === cav.utils.toChecksumAddress(walletInstance.address)) { // Issuer 로그인 경우
      await this.issuerUI();
    } else {
      this.userUI(walletInstance);
    }
    $('#address').attr('style','border:2px solid skyblue; padding:2px;white-space:pre-line;word-break:break-all;')
    $('#address').append('<h5>' + '주소:' + this.auth.address + '</h5>');
  },

  /**
   * << UI >>
   * user 관련 UI
   * @returns {Promise<void>}
   */
  userUI: async function () {
    $('#host_session_out').show(); //TODO: 임시로 만들어놓음
    $('#tooltip').show(); //TODO: 임시로 만들어놓음
    if(this.user.userType === 'Host'){
      this.hostUI();
    } else if(this.user.userType === 'Verifier' ){
      this.verifierUI();
    } else {
      alert("올바르지 않은 userType입니다. 신분증을 확인해주세요.");
    }
  },

  /**
   * << QR코드 >>
   * writer: 문준영
   * Host가 Cipher가지고 QR코드 생성하는 부분
   */

  sendIDCard:  function () {
    this.cipherHostData=sessionStorage.getItem('Cipher'); //세션스토리지에 저장한 cipher를 가져옴

    let tmp;
    var QRCode = require('qrcode')
    $("#qrcode-content").empty(); //qr코드 content내부값을 모두 삭제  (삭제안하면 모달안에 계속 추가됨)

    const hostdata={
      cipherHostData:this.cipherHostData,
      address:this.auth.address
    }
    //Host cipherData와 해당 host address를 객체로만들어서 QR코드로 생성
    const JSONhostdata=JSON.stringify(hostdata)
 
    QRCode.toDataURL(JSONhostdata, function (err, url) {
      $('#qrcode-content').append('<img src="' + url + '" width="100%" height="auto"/> ');
      tmp=url;
    })
    this.user.qrcode=tmp;
  },


  //QR코드 이미지 다운로드 함수 
  hostQrCodeDownload: async function() {
    var link = document.createElement("a");
    link.setAttribute("href", this.user.qrcode);
    link.setAttribute("download", "HostQRcode");
    link.click();
    alert("QR코드 이미지 파일이 다운로드가 완료되었습니다 ")
  },

  /**
   * << 컨트랙트 >>
   * Button_delete_IDCard
   * 블록 내 mapping 되어있는 공개키 삭제
   * TODO: 함수 확인 필요 - .call() / .send()? - 구체적인 시퀀스 필요
   */
  deleteIDCard: function () {
    if(agContract.methods.isPublicKey(this.auth.address).call()){
      agContract.methods.deletePublicKey(this.auth.address).call();
      alert("컨트랙의 공개키를 삭제하였습니다.");
    } else {
      alert("컨트랙에 공개키가 존재하지 않습니다.");
    }
  },

  /**
   * 필요기능:
   * IDCard 출력하기 (QR코드 가져오기?)
   * 신분증 삭제하기
   */
  hostUI: function () {
    $('#container_host_function').show();
  },

  /**
   * << 미구현 >>
   */
  verifierUI: function () {
    $('#container_verifier_function').show();
  },

  /**
   * << 회원가입 - 호스트 >>
   * 호스트 로그인시 비밀번호 입력 및 확인 후
   * 비밀번호 일치하면 가장 기본적인 IDCard 발급
   * 해당 아이디카드로 로그인 불가 - 이슈어를 통해 정식 신분증 발급 받은 후에 사용 할 수 있음
   */
  hostSignIn: function () {
    if ( (document.getElementById("host_password").value === document.getElementById("host_password_check").value) &&
          document.getElementById("host_password").value !== '') {
      this.user.password = document.getElementById("host_password").value;
      const account = cav.klay.accounts.create();
      const userKeystore = cav.klay.accounts.encrypt(account.privateKey, this.user.password.toString());
      this.IDCard = {
        UserType: this.user.userType,
        Cipher: '',
        Keystore: userKeystore,
        IssuerSign: '',
        UserSign: '',
      };
      this.fileDownload(JSON.stringify(this.IDCard, null, 8), "IDCard", "application/json"); // 최초의 IDCard
      location.reload();
    } else {
      alert("비밀번호를 다시 확인해주세요!");
    }
  },

  /**
   * << Verifier >>
   * verifier 가입부분
   */
  verifierSignIn: function(){
    if ( (document.getElementById("verifier_password").value === document.getElementById("verifier_password_check").value) &&
        document.getElementById("verifier_password").value !== '') {
      this.user.password = document.getElementById("verifier_password").value;
      const account = cav.klay.accounts.create();
      const userKeystore = cav.klay.accounts.encrypt(account.privateKey, this.user.password.toString());
      const IDCard = {
        UserType: this.user.userType,
        Cipher: '',
        Keystore: userKeystore,
        IssuerSign: '',
        UserSign: '',
        Name: '',
      };
      this.fileDownload(JSON.stringify(IDCard, null, 8), "VerifierIDCard", "application/json"); // 최초의 IDCard
      alert("Verifier IDCard가 발급되었습니다.")
      location.reload();
    } else {
      alert("비밀번호를 다시 확인해주세요!");
    }

  },



  /**
   * << 보안 - 키페어 발급 >>
   * @returns {{privateKey: *, publicKey: *}}
   */
  issueKeypair: function () {
    RSA.getKey();
    const privateKey = RSA.getPrivateKey();
    const publicKey = RSA.getPublicKey();
    return {
      privateKey: privateKey,
      publicKey: publicKey
    };
  },

  /**
   * << 컨트랙트 >>
   * 공개키를 주소에 맞추어 저장 - mapping을 통해 저장함
   * @param address : 공개키와 함께 등록할 주소
   * @param publicKey : 등록하고자 하는 공개키
   */
  postPublicKeyOnContract: async function (address, publicKey) {
    var spinner = this.showSpinner();
    await agContract.methods.setPublicKey(address, publicKey).send({
      from: address,
      gas: '2500000',
      value: 0
    })
        .once('transactionHash', (txHash) => { // transaction hash로 return 받는 경우
          console.log(`txHash: ${txHash}`);
        })
        .once('receipt', (receipt) => { // receipt(영수증)으로 return받는 경우
          console.log(`(#${receipt.blockNumber})`, receipt); // 어느 블록에 추가되었는지 확인할 수 있음
          alert("컨트랙에 공개키 (" + publicKey + ")를 저장했습니다."); // 입력된 host 정보
          spinner.stop();
          location.reload();
        })
        .once('error', (error) => { // error가 발생한 경우
          alert(error.message);
        });
  },

  /**
   * << IDCard 입력 >>
   * 유저가 아이디카드를 입력했을 때 상황에 맞춰 출력
   * 입력한 IDCard는 this.IDCard로 저장하게 됨.
   */
  handleUserImport: async function () {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]); //file 선택
    let keystore;

    fileReader.onload = async (event) => { // 선택 후 확인
      try {
        if (!this.checkValidKeystore(event.target.result)) { // 올바른 키스토어 파일인지 확인
          $('#message').text('유효하지 않은 keystore 파일입니다.');
          return;
        } //검증통과


        const IDCard = JSON.parse(event.target.result);
        this.IDCard=IDCard;
        this.user.userType = this.IDCard.UserType;

        if (this.user.userType === 'Host' || this.user.userType === 'Verifier') {
          keystore = this.IDCard.Keystore;
          if (this.IDCard.Cipher === '' || this.IDCard.IssuerSign === '') {
            alert('아직 발급되지 않은 ID Card 입니다. 기관에서 발급 후에 사용해주세요.')
            $('#loginModal').modal('hide');
          } else {
            this.auth.keystore = keystore;
            this.auth.address = keystore.address;
            sessionStorage.setItem('Name', this.IDCard.Name)
            sessionStorage.setItem('UserType', this.user.userType);
            sessionStorage.setItem('Cipher',IDCard.Cipher);
            
            $('#message').text('keysore 통과. 비밀번호를 입력하세요.');
            document.querySelector('#input-password').focus();
          }
        } else {
          $('#message').text('올바르지 않은 유저 타입입니다.');
        }
      } catch (event) {
        $('#message').text('유효하지 않은 keystore 파일입니다.');
      }
    }
  },


  /**
   * << DATA >>
   * User가 자신의 Data를 전달한 경우
   * HTML에서 데이터 불러와 각각에 저장
   * this.user에 저장하게 됨
   * 필요한 경우 추가 가능
   */
  setUserData: function () {
    if (this.user.userType === 'Host') {
      this.user.password = document.getElementById("host_password").value;
      this.user.name = document.getElementById("host_name").value;
      this.user.id_number = document.getElementById("host_id_front").value + "-" + document.getElementById("host_id_rear").value;
      this.user.phone = document.getElementById("host_phone").value;
    } else if (this.user.userType === 'Verifier') {
      this.user.password = document.getElementById("verifier_password").value;
      this.user.name = document.getElementById("verifier_name").value;
      this.user.id_number = document.getElementById("verifier_id").value;
      this.user.phone = document.getElementById("verifier_phone").value;
    }
  },

  /**
   * << UI - Issuer >>
   * Issuer 로그인 경우
   * - Issuer == owner인 경우
   * @returns {Promise<void>}
   */
  issuerUI: async function () {
    $('#issuer_notice').show();
    let isIssuerPublicKey = await agContract.methods.isIssuerPublicKey().call();
    /* 재발급 받는 방향도 고려해봐야할듯 */
    if (isIssuerPublicKey) { // 이미 키가 저장되어 있다면
      $('#Button_issuer_key').show().append("!재발급!");
      $('#data_input').show();
    } else { // 키가 저장되어 있지 않다면
      alert("키를 발급받으세요!");
      $('#Button_issuer_key').show();
    }
  },


  /**
   * << UserData - file export >>
   * user가 입력한 data를 파일로 출력
   * 이때 발급하는 사용자에게 0.1클레이 전송으로 이후 사용자 공개키를
   * 성공적으로 컨트랙에 올릴 수 있게 함
   */
  exportUserData: async function () {

    var spinner = this.showSpinner();
    const privateKey = this.auth.privateKey;
    this.setUserData();

    const userData = {
      name: this.user.name,
      id_number: this.user.id_number,
      phone: this.user.phone,
    }

    const cipher = RSA.encryptData(privateKey, userData);
    const issuerSign = RSA.sign(privateKey, userData);
      const IDCard = {
        UserType: this.user.userType,
        Cipher: cipher,
        Keystore: this.auth.keystore,
        IssuerSign: issuerSign,
        UserSign: '',
        Name: this.user.name,
      };
    if(this.user.userType == "Host"){
      IDCard.Name = ''
    }
    await this.fileDownload(JSON.stringify(IDCard, null, 8), "IDCard-" + this.user.name, "application/json");
    
    cav.klay.sendTransaction({
    from: await this.callOwner(),
    to: this.auth.keystore.address,
    value: '100000000000000000',
    gas: '2500000'
}).once('transactionHash', (txHash) => { // transaction hash로 return 받는 경우
          console.log(`txHash: ${txHash}`);
        })
        .once('receipt', (receipt) => { // receipt(영수증)으로 return받는 경우
          console.log(`(#${receipt.blockNumber})`, receipt); // 어느 블록에 추가되었는지 확인할 수 있음
          spinner.stop(); // loading ui 종료
          $('#privateKeyModal').modal('hide');
    	  alert("모바일 신분증이 발급되었습니다. (0.1 Klay 송금)");
          location.reload();
          //서명시 적당량 송금해주는 방식 -- 가스비 위임 트랜잭션 고려해봐야함
        })
        .once('error', (error) => { // error가 발생한 경우
          alert(error.message);
        });


  },


  /**
   *  << Confirm IDCard >>
   *  아이디카드를 등록하는 경우 사용
   */
  handleIDCard: async function () {
    if (this.auth.accessType === 'keystore') {
      try{ //caver instance 활용
        //키스토어와 비밀번호로 비밀키(privateKey)를 가져옴
        const privateKey = cav.klay.accounts.decrypt(this.auth.keystore, this.auth.password).privateKey;
        $('#IDCardModal').modal('hide');
        $('#Button_Issuer_Bring_IDCard').hide();
        $('#Text_User_Address').show().append('유저 주소: ' + this.auth.keystore.address);
      } catch (e) {
        $('#IDCard_message').text('비밀번호가 일치하지 않습니다.');
      }
    }
  },
















  /**
   * << 로그인 >> | << Host Data >>
   * 회원탈퇴하는 경우
   * host 정보를 모두 ''로 보내 계정 초기화
   * @returns {Promise<void>}
   */
  hostSessionOut: async function () {
    var spinner = this.showSpinner();

    this.resetHost();

    const walletInstance = this.getWallet(); // 로그인된 계정 정보 확인
    // 추가부분
    if(walletInstance) { // 계정 정보 존재하는지 확인
      agContract.methods.removeHost(walletInstance.address).send({
        from: walletInstance.address,
        gas: '2500000',   //send 함수 수정했음
        value: 0
      })
          .once('transactionHash', (txHash) => { // transaction hash로 return 받는 경우
            console.log(`txHash: ${txHash}`);
          })
          .once('receipt', (receipt) => { // receipt(영수증)으로 return받는 경우
            console.log(`(#${receipt.blockNumber})`, receipt); // 어느 블록에 추가되었는지 확인할 수 있음
            spinner.stop(); // loading ui 종료
            alert("초기화 컨트랙트를 전송했습니다."); // 입력된 host 정보
            location.reload();
          })
          .once('error', (error) => { // error가 발생한 경우
            alert(error.message);
          });
    }
  },






// ####### Functions - Can't control #######
// 확인 필요한 코드 - 확인 요청 한 후에 아래로 내릴 것



  /**
   * << Issuer - 키 생성 >>
   * 이슈어 개인키 / 공개키 생성
   * 개인키는 저장, 공개키는 블록에 저장함.
   * @returns {Promise<void>}
   */
  setIssuerKey: async function () {
    var spinner = this.showSpinner();

    RSA.getKey();
    await this.fileDownload(RSA.getPrivateKey(), 'IssuerPrivateKey', 'application/pem');
    const issuerPublicKey = RSA.getPublicKey();
    agContract.methods.setIssuerPublicKey(issuerPublicKey).send({
      from: await this.callOwner(),
      gas: '2500000',
      value: 0
    })
        .once('transactionHash', (txHash) => { // transaction hash로 return 받는 경우
          console.log(`txHash: ${txHash}`);
        })
        .once('receipt', (receipt) => { // receipt(영수증)으로 return받는 경우
          console.log(`(#${receipt.blockNumber})`, receipt); // 어느 블록에 추가되었는지 확인할 수 있음
          spinner.stop(); // loading ui 종료
          alert("컨트랙에 공개키 (" + issuerPublicKey + ")를 저장했습니다."); // 입력된 host 정보
          location.reload();
        })
        .once('error', (error) => { // error가 발생한 경우
          alert(error.message);
        });
  },


  /**
   * << 개인키 >>
   * 키 형식 확인
   * pksc8 형식에 맞는 개인키가 맞는지 확인
   * @param text
   * @returns {boolean|boolean}
   */
  checkValidPrivateKey: function (text) {
    return text.startsWith('-----BEGIN PRIVATE KEY-----') &&
        text.endsWith('-----END PRIVATE KEY-----');
  },


  /**
   * << 개인키 >>
   * 개인키 선택 시 유효한 개인키인지 확인 밎 keystore에 개인키 임시 저장 ( TODO: 변수 사용하지 말고 구현 방법 찾기 )
   */
  privateKeyImport: function () {
    const privateKey = new FileReader();
    privateKey.readAsText(event.target.files[0]); //file 선택
    privateKey.onload = (event) => { // 선택 후 확인
      try{
        if (!this.checkValidPrivateKey(event.target.result)){ // 올바른 키스토어 파일인지 확인
          $('#privateKey_message').text('유효하지 않은 privateKey 파일입니다.');
          return;
        } //검증통과
        this.auth.privateKey = event.target.result; // TODO 변수 설정 필요!!(전역 X)
        $('#privateKey_message').text('private 통과. 확인을 누르면 User Data File이 출력됩니다.');
      } catch (event) {
        $('#privateKey_message').text('유효하지 않은 privateKey 파일입니다.');
      }
    }
  },


  /**
   * << UserData >>
   * user data 형식 확인
   * userData 형식에 따라 바뀔필요있음
   * @param userDataFile
   * @returns {string}
   */
  checkValidIDCard: function (userDataFile) {
    const parseIDCard = JSON.parse(userDataFile);
    const isIDCard = parseIDCard.UserType &&
                     parseIDCard.Keystore;
    return isIDCard;
  },

  /**
   * << user data >>
   * userData 확인 후 cipherHostData에 cipher 저장
   */
  userDataImport: function () {
    const userData = new FileReader();
    userData.readAsText(event.target.files[0]); //file 선택
    userData.onload = (event) => { // 선택 후 확인
      try{
        if (!this.checkValidIDCard(event.target.result)){ // 올바른 파일인지 확인
          $('#IDCard_message').text('유효하지 않은 IDCard 파일입니다.');

        } else { //검증통과
          const IDCard = JSON.parse(event.target.result);
          if (IDCard.Cipher === '') {
            this.user.userType = IDCard.UserType;
            this.auth.keystore = IDCard.Keystore;
            // this.cipherHostData = IDCard.Cipher;
            $('#IDCard_message').text('올바른 IDCard 입니다.');
          } else {
            alert("이미 발급된 IDCard입니다. IDCard를 확인하세요.");
          }
        }
      } catch (e) {
        console.log(e);
        $('#decrypt_message').text('유효하지 않은 IDCard 입니다.');
      }
    }
  },

  /**
   * << 복호화 >>
   * userData를 publicKey로 복호화
   * @returns {Promise<void>}
   */
  decryptUserData: async function () {
    

    try {
      const HostEncrptyData=JSON.parse(this.cipherHostData);
     const IssuerPublicKey2 = await agContract.methods.getIssuerPublicKey().call(); //Issuer public Key 호출
     const HostPublickey2 = await agContract.methods.getPublicKey(HostEncrptyData.address).call();     //Host Public key 호출
     this.hostaddress=HostEncrptyData.address;  //호스트 주소 설정
     const d1 = RSA.decryptData(HostPublickey2, HostEncrptyData.cipherHostData); // Host public key로 해독 
      const d2 = RSA.decryptData(IssuerPublicKey2, d1); //issuer publickey 키로 해독
      const HostDecrptyData=JSON.parse(d2);
	  
    return HostDecrptyData;
    } catch (error) {
	   alert(error)
      return false;
    }
  },








// ###### Functions - Can control ######
//          정확히 작동되는 것만

  /**
   * << 로그인 >>
   * 유효한 키스토어 파일인지 확인
   */
  handleImport: async function () {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]); //file 선택
    let keystore;

    fileReader.onload = (event) => { // 선택 후 확인
      try{
        if (!this.checkValidKeystore(event.target.result)){ // 올바른 키스토어 파일인지 확인
          $('#message').text('유효하지 않은 keystore 파일입니다.');
          return;
        } //검증통과

        // this.user.userType = JSON.parse(event.target.result).UserType;
        if(this.user.userType === 'Issuer'){
          keystore = event.target.result;
        } else {
          $('#message').text('올바르지 않은 UserType입니다.');
        }

        this.auth.keystore = keystore;
        sessionStorage.setItem('UserType', this.user.userType);
        $('#message').text('keysore 통과. 비밀번호를 입력하세요.');
        document.querySelector('#input-password').focus();
      } catch (event) {
        $('#message').text('유효하지 않은 keystore 파일입니다.');
        return;
      }
    }
  },

  /**
   * << 로그인 >>
   * 비밀번호 저장
   * - 암호화 필요
   * - 사용하는 부분 한번 더 확인 필요
   */
  handlePassword: async function () {
    this.auth.password= event.target.value;
  },


  /**
   * << 로그인 >>
   * 키스토어와 비밀번호 확인 후 로그인 진행
   */
  handleLogin: async function () {
    if (this.auth.accessType === 'keystore') {
      try{ //caver instance 활용
        //키스토어와 비밀번호로 비밀키(privateKey)를 가져옴
        const privateKey = cav.klay.accounts.decrypt(this.auth.keystore, this.auth.password).privateKey;
        this.integrateWallet(privateKey);
        if (this.user.userType !== 'Issuer' && this.IDCard.UserSign === '') {
          const keypair = this.issueKeypair();
          const cipherWithUsers = RSA.encryptData(keypair.privateKey, this.IDCard.Cipher);

          // TODO: fs로 업데이트 진행 - cipher 그대로 업데이트 하면 됨.
          // cipher update
          const newIDCard = {
            UserType: this.IDCard.UserType,
            Cipher: cipherWithUsers,
            Keystore: this.IDCard.Keystore,
            IssuerSign: this.IDCard.IssuerSign,
            UserSign: RSA.sign(keypair.privateKey, cipherWithUsers), //TODO: data부분 확인
            Name: this.IDCard.Name,
          }


          this.IDCard = newIDCard;
          sessionStorage.setItem('IDCard', this.IDCard);

          await this.fileDownload(JSON.stringify(this.IDCard, null, 8), "IDCard-" + "-Usable", "application/json");
          await this.fileDownload(JSON.stringify(keypair.privateKey, null, 8), "PrivateKey-" + this.IDCard.Keystore.address, "application/json"); // 최초의 IDCard

          await this.postPublicKeyOnContract(this.auth.keystore.address, keypair.publicKey);
          this.removeWallet();
        }
        location.reload();
      } catch (e) {
        console.log(e);
        $('#message').text('비밀번호가 일치하지 않습니다.');
      }
    }
  },

  /**
   * << 로그인 >>
   * 로그아웃 하는 경우
   */
  handleLogout: async function () {
    this.removeWallet(); //wallet clear, session clear
    location.reload(); // page restart
  },

  /**
   * << 컨트랙트 >>
   * 컨트랙트 보낸 사람인지 확인
   */
  callOwner: async function () {
    return await agContract.methods.owner().call();
  },
  getIssuerAddress: async function(){
    return await agContract.methods.getIssuerAddress().call();
  },
  /**
   * << 컨트랙트 >>
   * cav.klay.accounts에 저장된 계정 중 첫번째 계정 불러옴
   * 첫번째 계정 == 내가 로그인한 계정
   */
  getWallet: function () {
    if (cav.klay.accounts.wallet.length) {
      return cav.klay.accounts.wallet[0];
    }
  },

  /**
   * << 컨트랙트 >> | << 로그인 >>
   * @param {} keystore
   * 올바른 키스토어 파일인지 확인
   * 키스토어 = {버전, id, 주소, crypto}이므로 모두 있는지 확인 후 return
   */
  checkValidKeystore: function (keystore) {
    let parseKeystore;
    if (this.user.userType === 'Issuer') {
      parseKeystore = JSON.parse(keystore);
    } else {
      parseKeystore = JSON.parse(keystore).Keystore;
    }

    const isValidKeystoreV3 = parseKeystore.version &&
        parseKeystore.id &&
        parseKeystore.address &&
        parseKeystore.crypto;

    const isValidKeystoreV4 = parseKeystore.version &&
        parseKeystore.id &&
        parseKeystore.address &&
        parseKeystore.keyring;

    return isValidKeystoreV3 || isValidKeystoreV4;
  },



  /**
   * << 로그인 >>
   * @param {*} priUvateKey
   * 계정 정보 세션에 저장
   * 세션이 꺼지기 전까지 정보 유지
   */
  integrateWallet: function (privateKey) {
    const walletInstance = cav.klay.accounts.privateKeyToAccount(privateKey);
    cav.klay.accounts.wallet.add(walletInstance); // caver instance를 통해 계정 정보를 쉽게 가져올 수 있음

    sessionStorage.setItem('walletInstance', JSON.stringify(walletInstance));
    // location.reload();
  },

  /**
   * << 로그인 >>
   * Keystore를 통한 계정 로그아웃
   */
  reset: function () {
    this.auth = {
      kestore: '',
      password: ''
    };
  },

  /**
   * << 로그인 >>
   * HostData reset
   * 회원탈퇴하는 경우 host data를 모두 undefined로 저장
   */
  resetHost: function (){
    this.user = {
      name: '',
      id_number: '',
      phone: ''
    },
        this.publicKey = {
          host: '',
          issuer: ''
        },
        this.privateKey = {
          host: '',
          issuer: ''
        }
  },

  /**
   * << 로그인 >>
   * 계정 로그아웃
   * 세션과 cav.klay.accounts에서 지움
   */
  removeWallet: function () {
    cav.klay.accounts.wallet.clear();
    sessionStorage.removeItem('walletInstance');
    this.reset();
  },

  /**
   * << UI >>
   * 로딩 화면 구현
   */
  showSpinner: function () {
    var target = document.getElementById("spin");
    return new Spinner(opts).spin(target);
  },
  /**
   * << 파일 다운로드 >>
   * download Session
   * @param data
   * @param filename
   * @param type
   * @returns {Promise<void>}
   */
  fileDownload: async function(data, filename, type){
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
      var link = document.createElement("a"),
          url = URL.createObjectURL(file);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(function() {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  },

  //Verifier에서 Host 신원 인증 내역 보기
  HostInfoPrint: async function(){
    //본인의 주소를 통해 인증한 내역 정보가져오기
    try {
    $( '#info_table > tbody').empty();
    const HostInfoSize=await agContract.methods.HostInfoSize(this.auth.address).call()
      for(var i=0; i<HostInfoSize;i++){
        const record = await agContract.methods.records(this.auth.address,i).call()
        $('#info_table > tbody:last').append("<tr ><td>"+record.name+"</td><td>" + record.addr +"</td><td>"+record.date+"</td></tr>")
      }
    }
    catch(error){
      alert(error)
    }
  },
    //Host에서 Verifier 인증 내역 보기
    VerifierInfoPrint: async function(){
      //본인의 주소를 통해 인증한 내역 정보가져오기
      try {
      $( '#host_info_table > tbody').empty();
      const VerifierInfoSize=await agContract.methods.HostInfoSize(this.auth.address).call()
        for(var i=0; i<VerifierInfoSize;i++){
          const record = await agContract.methods.records(this.auth.address,i).call()
          $('#host_info_table > tbody:last').append("<tr ><td>"+record.name+"</td><td>" + record.addr +"</td><td>"+record.date+"</td></tr>")
        }
      }
      catch(error){
        alert(error)
      }
    },

};



window.App = App;

window.addEventListener("load", function () {
  App.start();
});



//  문준영 추가 Cipher Hostdata 설정 전역함수로 뺴서 객체내 속성값 저장 
function setCipherHost(data){
App.cipherHostData=data;
}


var opts = {
  lines: 10, // The number of lines to draw
  length: 30, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#5bc0de', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'absolute' // Element positioning
};







// 문준영 추가 Verifier QR코드 스캔 기능구현
document.querySelector('#button-host-IDCard-scan').addEventListener('click', function () {

  var video = document.createElement("video");
  var canvasElement = document.getElementById("canvas");
  var canvas = canvasElement.getContext("2d");
  var loadingMessage = document.getElementById("loadingMessage");
  var outputContainer = document.getElementById("output");
  var outputMessage = document.getElementById("outputMessage");
  var outputData = document.getElementById("outputData");

  let tmpstream;


  function drawLine(begin, end, color) {
    canvas.beginPath();
    canvas.moveTo(begin.x, begin.y);
    canvas.lineTo(end.x, end.y);
    canvas.lineWidth = 4;
    canvas.strokeStyle = color;
    canvas.stroke();
  }


  // 카메라 사용시
	navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function(stream) {
      video.srcObject = stream;
      video.setAttribute("playsinline", true);      // iOS 사용시 전체 화면을 사용하지 않음을 전달
      video.play();
      requestAnimationFrame(tick);

       tmpstream=stream
         
      // QR코드 스캔 모달에서 닫기버튼 누를때 카메라끄기
      document.querySelector('#host-info-btn2').addEventListener('click', function () {
        stream.getTracks().forEach(function(track) {
          if (track.readyState == 'live' && track.kind === 'video') {
              track.stop();
          }
        });
      })
});


  async function tick() {
    loadingMessage.innerText = "⌛ 스캔 기능을 활성화 중입니다."
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      loadingMessage.hidden = true;
      canvasElement.hidden = false;
      outputContainer.hidden = false;
      // 읽어들이는 비디오 화면의 크기

      canvasElement.height = video.videoHeight;
      canvasElement.width = video.videoWidth;
      canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);
      var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);


      var code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });


      // QR코드 인식에 성공한 경우

      if (code) {
        // 인식한 QR코드의 영역을 감싸는 사용자에게 보여지는 테두리 생성
        drawLine(code.location.topLeftCorner, code.location.topRightCorner, "#FF0000");
        drawLine(code.location.topRightCorner, code.location.bottomRightCorner, "#FF0000");
        drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, "#FF0000");
        drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, "#FF0000");

        setCipherHost(code.data)
        const HostInfo=await App.decryptUserData()
        if(HostInfo){
          var spinner = App.showSpinner();
          var VerifierName = sessionStorage.getItem('Name');
          alert("스캔완료!")
          $('#verifier_host_data').show();
          $('#host-table-name').text(HostInfo.name);
          $('#host-table-id_number').text(HostInfo.id_number);
          $('#host-table-phone').text(HostInfo.phone);
          $('#qrcode-scan-container').modal('hide');
          
          const todaydate = getTodayDate()


          //Verifier측에서 인증 내역 저장 
          await agContract.methods.setCertificationInfo(HostInfo.name, todaydate, App.hostaddress, App.auth.address).send({
            from: App.auth.address,
            gas: '2500000',
            value: 0
          })
              .once('transactionHash', (txHash) => { // transaction hash로 return 받는 경우
                console.log(`txHash: ${txHash}`);
              })
              .once('receipt', (receipt) => { // receipt(영수증)으로 return받는 경우
                console.log(`(#${receipt.blockNumber})`, receipt); // 어느 블록에 추가되었는지 확인할 수 있음
                alert("컨트랙트에 Verifier 인증내역을 저장했습니다.");
                spinner.stop();
                HostTableContract(VerifierName,todaydate);
              })
              .once('error', (error) => { // error가 발생한 경우
                alert(error.message);
              });

              //Host측에서 인증 내역 저장 => 타입오류 뜰수도 테스팅하면서 확인해바야됨


          tmpstream.getTracks().forEach(function(track) {
          if (track.readyState == 'live' && track.kind === 'video') {
              track.stop();
          }});  
          
     

        }
        else{
          alert('스캔실패!')   
        }
      }


      else {
        outputMessage.hidden = false;
        outputData.parentElement.hidden = true;
      }
    }
    requestAnimationFrame(tick);
  }
  async function HostTableContract(VerifierName,todaydate){
    var spinner = App.showSpinner();
    await agContract.methods.setCertificationInfo(VerifierName, todaydate, App.auth.address,App.hostaddress).send({
      from: App.auth.address,
      gas: '2500000',
      value: 0
    })
        .once('transactionHash', (txHash) => { // transaction hash로 return 받는 경우
          console.log(`txHash: ${txHash}`);
        })
        .once('receipt', (receipt) => { // receipt(영수증)으로 return받는 경우
          console.log(`(#${receipt.blockNumber})`, receipt); // 어느 블록에 추가되었는지 확인할 수 있음
          alert("컨트랙트에 Host 인증내역을 저장했습니다.");
          spinner.stop();
          location.reload();
        })
        .once('error', (error) => { // error가 발생한 경우
          alert(error.message);
        });
  }
  function getTodayDate(){
    try{
    const today = new Date();   
    const year = today.getFullYear(); // 년도
    const month = today.getMonth() + 1;  // 월
    const date = today.getDate();  // 날짜
    const hour = today.getHours();  // 시간
    const minute = today.getMinutes(); //분
    const second = today.getSeconds(); //초
    const todaydate= year+'년'+month+'월'+date+'일 '+hour+"시"+minute+"분"+second+"초"
    return todaydate;
    }
    catch(error){
      alert(error)
    }
    return todaydate;
  }
});


