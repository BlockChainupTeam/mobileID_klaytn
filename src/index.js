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
    address: ''
    //개인주소 추가
  },

  user:{
    password: '',
    userType: '',
    name: '',
    id_number: '',
    phone: ''
  },

  cipherHostData: '',
  IDCard: '',
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
    $('#address').append('<br>' + '<p>' + '내 계정주소: ' + this.auth.address + '</p>');

    this.user.userType = sessionStorage.getItem("UserType");

    // issuer가 접속한 경우에만 호스트 데이터 입력할 수 있도록
    if (await this.callOwner() === cav.utils.toChecksumAddress(walletInstance.address)) { // Issuer 로그인 경우
      await this.issuerUI();
    } else {
      this.userUI(walletInstance);
    }
    $('#address').append('<br>' + '<p>' + '내 계정주소: ' + this.auth.address + '</p>');
  },



  userUI: async function () {
  
    $('#host_session_out').show(); //TODO: 임시로 만들어놓음
    $('#tooltip').show(); //TODO: 임시로 만들어놓음
    $('#HostPublicKey').append("Host 공개키 : " + await agContract.methods.getPublicKey(this.auth.address).call()); //TODO: 공개키 보여줄 필요 없음
    if(this.user.userType === 'Host'){
      this.hostUI(); //TODO UI 다른것으로 변경필요
    } else if(this.user.userType === 'Verifier' ){
      this.verifierUI();
    } else {
      alert("올바르지 않은 userType입니다. 신분증을 확인해주세요.");
    }
  },

  /**
   * 필요기능:
   * IDCard 출력하기 (QR코드 가져오기?)
   * 신분증 삭제하기
   */
  hostUI: function () {
    $('#host_login').show();
    $('#host_signIn').show();
  },

  verifierUI: function () {

  },

  hostSignIn: function () {
    if ( (document.getElementById("host_password").value === document.getElementById("host_password_check").value) &&
          document.getElementById("host_password").value !== '') {
      this.user.password = document.getElementById("host_password").value;
      console.log(this.user.password);
      const account = cav.klay.accounts.create();
      const userKeystore = cav.klay.accounts.encrypt(account.privateKey, this.user.password.toString());
      const IDCard = {
        UserType: this.user.userType,
        Cipher: '',
        Keystore: userKeystore,
        IssuerSign: '',
        UserSign: '',
      };
      this.fileDownload(JSON.stringify(IDCard, null, 8), "IDCard", "application/json"); // 최초의 IDCard
      location.reload();
    } else {
      alert("비밀번호를 다시 확인해주세요!");
    }
  },


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
    // $('#data_input').show();
    let isIssuerPublicKey = await agContract.methods.isIssuerPublicKey().call();
    /* 재발급 받는 방향도 고려해봐야할듯 */
    if (isIssuerPublicKey) { // 이미 키가 저장되어 있다면
      $('#Button_issuer_key').hide();
      $('#IssuerPublicKey').append("Issuer 공개키 : " + await agContract.methods.getIssuerPublicKey().call()); //TODO: 필요없으면 제거해도 됨
    } else { // 키가 저장되어 있지 않다면
      alert("키를 발급받으세요!");
      $('#Button_issuer_key').show();
    }
  },


  /**
   * << UserData - file export >>
   * user가 입력한 data를 파일로 출력
   */
  exportUserData: async function () {

    var spinner = this.showSpinner();
    const privateKey = this.auth.keystore;
    this.setUserData();

    const userData = {
      name: this.user.name,
      id_number: this.user.id_number,
      phone: this.user.phone
    }
    const cipherPre = RSA.encryptData(privateKey, userData);
    RSA.getKey();
    const HostPrivateKey = RSA.getPrivateKey();
    const HostPublicKey = RSA.getPublicKey();
    await this.fileDownload(HostPrivateKey, this.user.name + '-PrivateKey', 'application/pem');
    const cipher = RSA.encryptData(HostPrivateKey, cipherPre);
    const account = cav.klay.accounts.create();
    const userKeystore = cav.klay.accounts.encrypt(account.privateKey, this.user.password.toString()); // !!ERROR!!
    console.log(userKeystore.address);
    await agContract.methods.setPublicKey(userKeystore.address, HostPublicKey).send({
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
          alert("컨트랙에 공개키 (" + HostPublicKey + ")를 저장했습니다."); // 입력된 host 정보
          location.reload();
        })
        .once('error', (error) => { // error가 발생한 경우
          alert(error.message);
        });
    

    const IDCard = {
      UserType: this.user.userType,
      cipher: cipher,
      keystore: userKeystore
    };

    await this.fileDownload(JSON.stringify(IDCard, null, 8), "IDCard-" + this.user.name, "application/json");

    $('#privateKeyModal').modal('hide');
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
        this.auth.keystore = event.target.result; // TODO 변수 설정 필요!!(전역 X)
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
  checkValidUserData: function (userDataFile) {
    const parseUserData = JSON.parse(userDataFile);
    return parseUserData.UserType &&
        parseUserData.cipher;
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
        if (!this.checkValidUserData(event.target.result)){ // 올바른 파일인지 확인
          $('#privateKey_message').text('유효하지 않은 userData 파일입니다.');
          return;
        } //검증통과
        this.cipherHostData = JSON.parse(event.target.result).cipher;
        $('#decrypt_message').text('userData 통과. ');
      } catch (event) {
        $('#decrypt_message').text('유효하지 않은 userData 파일입니다.');
      }
    }
  },

  /**
   * << 복호화 >>
   * userData를 publicKey로 복호화
   * @returns {Promise<void>}
   */
  decryptUserData: async function () {
    const ipk = await agContract.methods.getIssuerPublicKey().call();
    const hpk = await agContract.methods.getPublicKey(this.auth.address).call();
    const d1 = RSA.decryptData(hpk, this.cipherHostData);
    alert('다음 공개키로 host의 서명확인:'+'\n'+hpk);
    const d2 = RSA.decryptData(ipk, d1);
    alert('다음 공개키로 issuer의 서명확인:'+'\n'+ipk);
    alert(d2);
    $('#decryptModal').modal('hide');
    location.reload();
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

        this.user.userType = JSON.parse(event.target.result).UserType;
        if(this.user.userType === 'Host' || this.user.userType ===  'Verifier'){
          keystore = JSON.parse(event.target.result).Keystore;
        } else {
          keystore = event.target.result;
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
    location.reload();
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
};



window.App = App;

window.addEventListener("load", function () {
  App.start();
});

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
