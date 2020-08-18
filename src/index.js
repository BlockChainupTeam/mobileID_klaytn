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

  host:{
    name: '',
    id_number: '',
    phone: ''
  },

  publicKey:{
    host: '',
    issuer: ''
  }, //공용키

  privateKey:{
    host: '',
    issuer: ''
  }, //개인키 //임시로 issuer것도

  testData:{
    hostData: '',
    publicKey: ''
  },

  cipherHostData: '',

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

        // 2. Session에 들어온 후 해당 계정의 Host Data 불러오기
        const MyInfo = await this.checkValidHost(this.auth.address);

        if(MyInfo){ // host정보가 입력되어 있는 경우
          await this.changeUI_Hostdata_has();
        } else { // host정보가 입력되어 있지 않은 경우
          await this.changeUI_Hostdata_none();
        }

      } catch (e) { // 유효한 계정 정보가 아닌경우
        sessionStorage.removeItem('walletInstance'); // session에서 정보 지움
      }
    }
  },

  /**
   * << 컨트랙트 >>
   * Host data를 폼에 맞게 입력하면, 해당 데이터를 contract로 블록에 저장
   * 암호화 필요
   * @returns {Promise<void>}
   */
  inputHostData: async function () {
    var spinner = this.showSpinner();

    // html에서 입력받은 값 host에 저장함
    this.host.name = document.getElementById("host_name").value;
    this.host.id_number = document.getElementById("host_id_front").value + "-" + document.getElementById("host_id_rear").value;
    this.host.phone = document.getElementById("host_phone").value;

    const walletInstance = this.getWallet(); // 로그인된 계정 정보 확인
    const hostData = { name: this.host.name, id_number: this.host.id_number, phone: this.host.phone };

    await this.rsaGenerate(hostData);
    await this.fileDownload(this.cipherHostData, 'hostData', 'txt');
    await this.fileDownload(this.privateKey.host, 'privateKey', 'dll');
    await this.fileDownload(this.publicKey.host, 'publicKey', 'pem');

    // 추가부분
    if(walletInstance) { // 계정 정보 존재하는지 확인
      if(this.host) {// 정확히 구현필요
        agContract.methods.setHost(walletInstance.address, this.publicKey.host, this.publicKey.issuer).send({
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
              alert(JSON.stringify(this.publicKey) + "로 컨트랙에 저장했습니다."); // 입력된 host 정보
              location.reload();
            })
            .once('error', (error) => { // error가 발생한 경우
              alert(error.message);
            });
      } return; // host 정보 없으면 종료
    }
  },



  /* 전역변수로 갖는게 맞을지 모르겠네 */
  //TODO: 시나리오 맞게 분할할것
  rsaGenerate: async function(hostData){
    this.publicKey.host = RSA.getPublicKey();
    this.privateKey.host = RSA.getPrivateKey();

    this.cipherHostData = RSA.encrypt(hostData);
    this.publicKey.issuer = RSA.getPublicKey();
    this.privateKey.issuer = RSA.getPrivateKey();
    console.log("Host Public Key : ",this.publicKey.host);
    console.log("Host Private Key : ",this.privateKey.host);
    console.log("Issuer Public Key : ",this.publicKey.host);
    console.log("Issuer Private Key : ",this.privateKey.host);
  },


  /**
   * << 임시 >>
   * host data file 가져오기
   * @returns {Promise<void>}
   */
  hostDataImport: async function () {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]); //file 선택
    fileReader.onload = (event) => { // 선택 후 확인
      this.testData.hostData = event.target.result;
      $('#message').text('hostData 로드');
    }
  },

  /**
   * << 임시 >>
   * publidkey 가져오기
   * @returns {Promise<void>}
   */
  publicKeyImport: async function () {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]); //file 선택
    fileReader.onload = (event) => { // 선택 후 확인
      this.testData.publicKey = event.target.result;
      $('#message').text('publicKey 로드');
    }
  },

  /**
   * << 임시 >>
   * 파일 확인
   * @returns {Promise<void>}
   */
  verifyTest: async function (){
    RSA.init();
    RSA.importKey(this.testData.publicKey);
    console.log(RSA.getPublicKey());
    const decipher = RSA.decrypt(this.testData.hostData);
    alert("공개키로 복호화된 정보\n" + decipher);
  },

  /**
   * << UI >>
   * hostdata 있는 경우
   * login창 없애고
   * 로그인 버튼없애고 로그아웃 버튼으로
   * 호스트 정보 입력창 없애고 호스트 정보 출력
   * 호스트 정보 초기화 버튼 출력
   *
   * 추후 필요 정보 업데이트 요망
   */
  changeUI_Hostdata_has: async function () {
    $('#loginModal').modal('hide');
    $('#login').hide();
    $('#logout').show();
    $('#host_input').hide();

    $('#host_data').show();
    $('#host_session_out').show();
    $('#host_data').append('<br>' + '<p>' + 'Host 공개키: ' + '<br>'+ this.publicKey.host + '</p>' + '<br>'
        + '<p>' + 'Issuer 공개키: ' + '<br>'+ this.publicKey.issuer + '</p>' + '<br>'
        + '<p>' + '현재 회원수: ' + await this.getHostCountFromContracts() + '</p>');
  },


  /**
   *  << 컨트랙트 >>
   *  컨트랙트에서 host정보 가져옴
   * @param address : 현재 사용자 계정 주소
   * @returns {Promise<*>}
   */
  getHostFromContracts: async function (address) {
    return await agContract.methods.getHost(address).call();
  },

  getHostCountFromContracts: async function () {
    return await agContract.methods.getHostCount().call();
  },

  /**
   * << 컨트랙트 >> | << 로그인 >>
   * 컨트랙에서 가져온 호스트 정보 this.host에 저장
   * @param address 계정 주소
   * @returns {Promise<boolean>}
   */
  checkValidHost: async function (address) {
    const MyInfo = await this.getHostFromContracts(address);

    this.publicKey.host = MyInfo.hostKey;
    this.publicKey.issuer = MyInfo.issuerKey;
    console.log(RSA);
    console.log("isJoined?: ",MyInfo.joined);
    console.log("hk:",this.publicKey.host);
    console.log("ik:",this.publicKey.issuer);
    return MyInfo.joined;
  },







// ####### Functions - Can't control #######
// 확인 필요한 코드 - 확인 요청 한 후에 아래로 내릴 것





  /**
   * << UI >>
   * hostdata 없는 경우
   * 로그인부분 없애고 로그아웃 버튼으로
   * 호스트 정보 입력창 출력
   */
  changeUI_Hostdata_none: async function () {
    $('#loginModal').modal('hide');
    $('#login').hide();
    $('#logout').show();

    $('#host_input').show();
    $('#host_data').hide();
    $('#host_session_out').hide();
    $('#address').append('<br>' + '<p>' + '내 계정주소: ' + this.auth.address + '</p>');
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


  /**
   * << 파일 다운로드 >>
   * download Session
   * @param data
   * @param filename
   * @param type
   * @returns {Promise<void>}
   */
  fileDownload: async function(data, filename, type){
    const file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
      const _download = document.createElement("_download"),
          url = URL.createObjectURL(file);
      _download.href = url;
      _download.download = filename;
      document.body.appendChild(_download);
      _download.click();
      setTimeout(function() {
        document.body.removeChild(_download);
        window.URL.revokeObjectURL(url);
      }, 0);
    }
  },


// ###### Functions - Can control ######
//          정확히 작동되는 것만


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
    const parseKeystore = JSON.parse(keystore);
    const isValidKeystore = parseKeystore.version &&
        parseKeystore.id &&
        parseKeystore.address &&
        parseKeystore.crypto;

    return isValidKeystore;
  },

  /**
   * << 로그인 >>
   * 유효한 키스토어 파일인지 확인
   */
  handleImport: async function () {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0]); //file 선택
    fileReader.onload = (event) => { // 선택 후 확인
      try{
        if (!this.checkValidKeystore(event.target.result)){ // 올바른 키스토어 파일인지 확인
          $('#message').text('유효하지 않은 keystore 파일입니다.');
          return;
        } //검증통과
        this.auth.keystore = event.target.result;
        $('#message').text('keysore 통과. 비밀번호를 입력하세요.');
        document.querySelector('#input-password').focus();
      } catch (event) {
        $('#message').text('유효하지 않은 keystore 파일입니다.');
      }
    }
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
    this.host = {
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
   * 세션과 cav.clay.accounts에서 지움
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
