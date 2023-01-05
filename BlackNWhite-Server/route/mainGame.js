const config = require('../configure');

const crypto = require("crypto");
const randomId = () => crypto.randomBytes(8).toString("hex");

const BlackTeam = require("../schemas/roomTotal/BlackTeam");
const WhiteTeam = require("../schemas/roomTotal/WhiteTeam");
const BlackUsers = require("../schemas/roomTotal/BlackUsers");
const UserCompanyStatus = require("../schemas/roomTotal/UserCompanyStatus");
const WhiteUsers = require("../schemas/roomTotal/WhiteUsers");
const Company = require("../schemas/roomTotal/Company");
const Section = require("../schemas/roomTotal/Section");
const Progress = require("../schemas/roomTotal/Progress");
const RoomInfoTotal = require("../schemas/roomTotal/RoomInfoTotal");
const User = require("../schemas/roomTotal/User");
const RoomInfo = require("../schemas/roomTotal/RoomInfo");

const {lobbyLogger, gameLogger, chattingLogger} = require('../logConfig'); 
var server_ip = "128.0.0.1";

String.prototype.replaceAt = function(index, replacement) {
    if (index >= this.length) {
        return this.valueOf();
    }

    return this.substring(0, index) + replacement + this.substring(index + 1);
}

module.exports = async(io, socket, redisClient) => {
    const { RedisSessionStore } = require("../sessionStore");
    const sessionStore = new RedisSessionStore(redisClient);

    const { redisHashTableStore } = require("../redisHashTableStore");
    const hashtableStore = new redisHashTableStore(redisClient);

    const { RedisJsonStore } = require("../redisJsonStore");
    const jsonStore = new RedisJsonStore(redisClient);

    const { redisListStore } = require("../redisListStore");
    const listStore = new redisListStore(redisClient);

    const { RedisRoomStore } = require("../roomStore");
    const redis_room = new RedisRoomStore(redisClient);
    
    let companyNameList = ["companyA", "companyB", "companyC", "companyD", "companyE"];
    let taticNamesList = ["Reconnaissance", "Resource Development", "Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement", "Collection", "Command and Control", "Exfiltration", "Impact"];
    let areaNameList = ["DMZ", "Internal", "Security"]

    let timerId;
    let pitaTimerId;

    // [MainGame] 게임 시작시 해당 룸의 사용자 정보 넘김
    socket.on('InitGame',  async() =>{
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        let abandonStatusList = [];

        console.log("roomTotalJson : ", roomTotalJson);

        for(let company of companyNameList){
            abandonStatusList.push(roomTotalJson[0][company]["abandonStatus"]);
        }

        var pitaNum;
        let teamProfileJson = {}
        let userId = []
        if (socket.team == true){
            pitaNum = roomTotalJson[0]["whiteTeam"]["total_pita"];
            for (const userID in roomTotalJson[0]["whiteTeam"]["users"]){
                teamProfileJson[userID] = roomTotalJson[0]["whiteTeam"]["users"][userID]["profileColor"];
                userId.push(userID);
            }

        } else {
            pitaNum = roomTotalJson[0]["blackTeam"]["total_pita"];
            for (const userID in roomTotalJson[0]["blackTeam"]["users"]){
                teamProfileJson[userID] = roomTotalJson[0]["blackTeam"]["users"][userID]["profileColor"];
                userId.push(userID);
            }
        }

        var room_data = { 
            teamName : socket.team,
            teamProfileColor : teamProfileJson,
            userID : userId,
            teamNum : userId.length
        };
        var roomJson = JSON.stringify(room_data);

        socket.emit('MainGameStart', roomJson);
        socket.emit('Load Pita Num', pitaNum);
        io.sockets.in(socket.room).emit('Company Status', abandonStatusList);
        socket.emit('Visible LimitedTime', socket.team.toString()); // actionbar

        // Timer 시작(게임전체시간)
        var time = config.GAME_TIME;

        // 게임 시간 타이머 
        io.sockets.in(socket.room).emit('Timer START', time);
        timerId = setInterval(async function(){
            min = parseInt(time/60);
            sec = time%60;
            time--;
            if(time<1) {
                io.sockets.in(socket.room).emit('Timer END');
                io.sockets.in(socket.room).emit('Load_ResultPage');                    
                let roomTotalJsonFinal = JSON.parse(await jsonStore.getjson(socket.room));                    
                socket.on('Finish_Load_ResultPage', ()=> { TimeOverGameOver(socket, roomTotalJsonFinal); });                    
                clearInterval(timerId);
                clearInterval(pitaTimerId);                    
            }
        }, 1000);

        // pita 10초 간격으로 pita 지급
        var pitaInterval= config.BLACK_INCOME.time * 1000; // black, white 동일함 * 1000초
        pitaTimerId = setInterval(async function(){
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            roomTotalJson[0].blackTeam.total_pita += config.BLACK_INCOME.pita;
            roomTotalJson[0].whiteTeam.total_pita += config.WHITE_INCOME.pita;

            var black_total_pita = roomTotalJson[0].blackTeam.total_pita;
            var white_total_pita = roomTotalJson[0].whiteTeam.total_pita;

            await jsonStore.updatejson(roomTotalJson[0], socket.room);

            console.log("!!! [월급 지급] black_total_pita : " + black_total_pita + " white_total_pita : " + white_total_pita);
            
            io.sockets.in(socket.room+'false').emit('Update Pita', black_total_pita);
            io.sockets.in(socket.room+'true').emit('Update Pita', white_total_pita);    
        }, pitaInterval);
    });
    

    // [블랙팀] 시나리오의 힌트북 레벨 정보 emit
    socket.on('GetScenarioLv',  async function() {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);
        socket.emit('BroadScenarioLv', scenarioLvList);
    });


        // [블랙팀] 시나리오의 힌트북 레벨업 
        socket.on('TryUpgradeScenario',  async function(selectedScenario) {
        //  json 불러와서 블랙피타정보, 시나리오 레벨 정보 가져옴
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var black_total_pita = roomTotalJson[0].blackTeam.total_pita;
        var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);
        var scenarioLv = scenarioLvList[selectedScenario];

        // 레벨업 가능한지 확인
        if (scenarioLv >= 5){
            socket.emit('ResultUpgradeScenario', false);
            return;
        }

        // 가격 확인
        if (parseInt(black_total_pita) - parseInt(config.UPGRADE_SCENARIO.pita[scenarioLv]) < 0){
            socket.emit('ResultUpgradeScenario', false);
            return;
        };

        // lv 업그레이드 및 pita 가격 마이너스 
        scenarioLvList[selectedScenario] += 1
        roomTotalJson[0]["blackTeam"]["scenarioLevel"] = scenarioLvList;
        roomTotalJson[0].blackTeam.total_pita = parseInt(roomTotalJson[0].blackTeam.total_pita) - parseInt(config.UPGRADE_SCENARIO.pita[scenarioLv]);
        await jsonStore.updatejson(roomTotalJson[0], socket.room);

        io.sockets.in(socket.room+'false').emit('Update Pita', roomTotalJson[0].blackTeam.total_pita );
        socket.emit('ResultUpgradeScenario', true);
        io.sockets.in(socket.room).emit('BroadScenarioLv', scenarioLvList);
    });

        // [블랙팀] 시나리오의 힌트북 구입
        socket.on('TryBuyScenario',  async function(selectedScenario) {
        //  json 불러와서 블랙피타정보, 시나리오 레벨 정보 가져옴
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var black_total_pita = roomTotalJson[0].blackTeam.total_pita;
        var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);
        var scenarioLv = scenarioLvList[selectedScenario];

        // 레벨업 가능한지 확인
        if (scenarioLv != -1){
            socket.emit('ResultBuyScenario', false);
            return;
        }

        // 가격 확인
        if (parseInt(black_total_pita) - parseInt(config.BUY_SCENARIO.pita[selectedScenario]) < 0){
            socket.emit('ResultBuyScenario', false);
            return;
        };

        // lv 업그레이드 및 pita 가격 마이너스 
        scenarioLvList[selectedScenario] += 1
        roomTotalJson[0]["blackTeam"]["scenarioLevel"] = scenarioLvList;
        roomTotalJson[0].blackTeam.total_pita = parseInt(roomTotalJson[0].blackTeam.total_pita) - parseInt(config.UPGRADE_SCENARIO.pita[scenarioLv]);
        await jsonStore.updatejson(roomTotalJson[0], socket.room);

        io.sockets.in(socket.room+'false').emit('Update Pita', roomTotalJson[0].blackTeam.total_pita );
        socket.emit('ResultBuyScenario', true);
        io.sockets.in(socket.room).emit('BroadScenarioLv', scenarioLvList);
    });


    // [블랙팀] 해당 섹션의 선택된 시나리오의 힌트북 가져옴 
    socket.on('GetSectAttScenario',  async function(data) {
        var scenarioLv = 0;
        var scenarioNum = data.scenario + 1;
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));  
        
        // 회사의 시나리오 레벨 &선택한 시나리오 가져옴
        var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);

        if (data.scenario != -1){
            // 시나리오 레벨에 따라 선택한 시나리오 정보 가져옴
            scenarioLv = scenarioLvList[data.scenario];
            console.log("!-- scenarioLv : ", scenarioLvList[data.scenario]);

            var sectScenarioHint = { 
                selectScenario : data.scenario,
                scenarioLv : scenarioLv
            };

            var attackHint = []; 
            var progressAtt = [];

            // 단계 1. 현재 진행 중인 공격 뽑기 (attackSenarioProgress스키마)
            var sectionAttProgSenario = roomTotalJson[0][data.company].sections[data.section].attackSenarioProgress[data.scenario];
        
            sectionAttProgSenario.forEach((value, index, array) => {
                console.log(`${index} :  ${value.attackName}`); 
                    var attIdx = config.ATTACK_CATEGORY_DICT[value.tactic];
                    progressAtt.push    ({'attIdx' : attIdx, 'attack' : value.attackName});
            });

            sectScenarioHint['progressAtt'] = progressAtt;

            // 단계 2. 레벨별 힌트 저장 
            if (scenarioLv == 1){ 
                // lv1: 각 단계 공격 여부
                for(let i = 0; i <= 13; i++){
                    if(Object.values(config["SCENARIO" +scenarioNum].attacks[i]).length == 0){
                        attackHint[i] =  false;
                    }else{
                        attackHint[i] =  true;
                    }
                }
                sectScenarioHint['isAttacks'] = attackHint;
            }

            if(scenarioLv >= 2){ // lv :2~5 적용 
                // lv2: 각 단계 공격 개수
                for(let i = 0; i <= 13; i++){
                    attackHint[i] =  Object.values(config["SCENARIO" +scenarioNum].attacks[i]).length;
                }

                sectScenarioHint['attacksCnt'] = attackHint;
            }

            // lv3 : 다음 공격에 대한 힌트는 GetConnectedAtt함수 기능

            if(scenarioLv >= 4){ 
                // lv4: 모든 공격, 화살표 공개
                sectScenarioHint['attacks']=  config["SCENARIO" +scenarioNum].attacks;
                sectScenarioHint['attackConn'] = config["SCENARIO" +scenarioNum].attackConn;
            }

            if(scenarioLv >= 5){ 
                // lv5: 메인공격 공개
                sectScenarioHint['mainAttack'] = config["SCENARIO" +scenarioNum].mainAttack;
            }
        }

        // 힌트 보내기
        let sectScenarioHintJson = JSON.stringify(sectScenarioHint);
        console.log('sectionScenarioJson', sectScenarioHintJson);

        socket.emit('SendSectAttScenario', sectScenarioHintJson);
    });
    

    // [블랙팀] 선택한 공격에 연결된 다음 공격 정보 가져오기
    socket.on('GetConnectedAtt',  async function(data) {
        var scenarioLv = 0;
        var scenarioNum = data.scenario + 1;
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        
        // 회사의 시나리오 레벨 &선택한 시나리오 가져옴
        var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);

        // 시나리오 레벨에 따라 선택한 시나리오 정보 가져옴
        scenarioLv = scenarioLvList[data.scenario];
        
        // check1. 레벨 3이상인지 확인
        if(scenarioLv <= 2) return; 

        // check2. 레벨 3이면 진행된 공격인지 확인 (attackConn 연결이 true이면 됨)
        if(scenarioLv == 3){
            var isAttacked = false;
            var sectionAttProgSenario = Object.values(roomTotalJson[0][data.company].sections[data.section].attackConn[0]);
            var attackParents = [];
            attackParents = config["SCENARIO" +scenarioNum].attackConnParent[data.attack];

            for (const attParent in attackParents) {
                if (sectionAttProgSenario[attParent][data.attack] == true){
                    isAttacked = true;
                    break;
                }
            }

            if (isAttacked == false){
                return;
            }
        } 

        // 공격 정보 뿌려주기
        var connectedAttHint = {};
        connectedAttHint['attack'] = data.attack;
        connectedAttHint['connection'] = config["SCENARIO" +scenarioNum].attackConnDetail[data.attack];
        let connectedAttJson = JSON.stringify(connectedAttHint);
        socket.emit('SendConnectedAtt', connectedAttJson);
    });


        // [화이트팀] 해당 선택한 시나리오의 힌트북 가져옴 
        socket.on('GetScenario',  async function(data) {
        var scenarioHint = { 
            selectScenario : data.scenario,
        };
        var attackHint = []; 
        var scenarioNum = data.scenario + 1;

        // lv2: 각 단계 공격 개수
        for(let i = 0; i <= 13; i++){
            attackHint[i] =  Object.values(config["SCENARIO" +scenarioNum].attacks[i]).length;
        }
        scenarioHint['attacksCnt'] = attackHint;

        // lv4: 모든 공격, 화살표 공개
        scenarioHint['attacks']=  config["SCENARIO" +scenarioNum].attacks;
        scenarioHint['attackConn'] = config["SCENARIO" +scenarioNum].attackConn;

        // lv5: 메인공격 공개
        scenarioHint['mainAttack'] = config["SCENARIO" +scenarioNum].mainAttack;
            
        // 힌트 보내기
        let scenarioHintJson = JSON.stringify(scenarioHint);

        socket.emit('SendScenario', scenarioHintJson);
    });

        // [화이트팀] 선택한 공격에 연결된 다음 공격 정보 가져오기
        socket.on('GetConnectedAttAll',  async function(data) {
        var scenarioNum = data.scenario + 1;
        var connectedAttHint = {};

        connectedAttHint['attack'] = data.attack;
        connectedAttHint['connection'] = config["SCENARIO" +scenarioNum].attackConnDetail[data.attack];
        
        let connectedAttJson = JSON.stringify(connectedAttHint);
        socket.emit('SendConnectedAttAll', connectedAttJson);
    });


    ////////////////////////////////////////////////////////////////////////////////////
    // 회사 선택 후 사용자들에게 위치 알리기
    socket.on("Select Company", async(CompanyName) => {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

        let teamLocations = {};
        let teamLocationsJson = "";

        if (socket.team == true) {
            roomTotalJson[0]["whiteTeam"]["users"][socket.userID]["currentLocation"] = CompanyName;
            for (const userID in roomTotalJson[0]["whiteTeam"]["users"]){
                teamLocations[userID] = roomTotalJson[0]["whiteTeam"]["users"][userID]["currentLocation"];
            }
            
            teamLocationsJson = JSON.stringify(teamLocations);
            socket.to(socket.room+'true').emit("Load User Location", teamLocationsJson);
        } else {
            roomTotalJson[0]["blackTeam"]["users"][socket.userID]["currentLocation"] = CompanyName;
            for (const userID in roomTotalJson[0]["blackTeam"]["users"]){
                teamLocations[userID] = roomTotalJson[0]["blackTeam"]["users"][userID]["currentLocation"];
            }

            teamLocationsJson = JSON.stringify(teamLocations);
            socket.to(socket.room+'false').emit("Load User Location", teamLocationsJson);
        }

        socket.emit("Load User Location", teamLocationsJson);

        await jsonStore.updatejson(roomTotalJson[0], socket.room);
    });


    socket.on("Back to MainMap", async() => {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

        let teamLocations = {};
        let teamLocationsJson = "";

        if (socket.team == true) {
            roomTotalJson[0]["whiteTeam"]["users"][socket.userID]["currentLocation"] = "";
            for (const userID in roomTotalJson[0]["whiteTeam"]["users"]){
                teamLocations[userID] = roomTotalJson[0]["whiteTeam"]["users"][userID]["currentLocation"];
            }

            teamLocationsJson = JSON.stringify(teamLocations);
            socket.to(socket.room+'true').emit("Load User Location", teamLocationsJson);
        } else {
            roomTotalJson[0]["blackTeam"]["users"][socket.userID]["currentLocation"] = "";
            for (const userID in roomTotalJson[0]["blackTeam"]["users"]){
                teamLocations[userID] = roomTotalJson[0]["blackTeam"]["users"][userID]["currentLocation"];
            }

            teamLocationsJson = JSON.stringify(teamLocations);
            socket.to(socket.room+'false').emit("Load User Location", teamLocationsJson);
        }
        
        socket.emit("Load User Location", teamLocationsJson);

        await jsonStore.updatejson(roomTotalJson[0], socket.room);
        roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
    });

    socket.on("Section Activation Check", async(companyName) => {
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        
        var activationList = [];
        if (socket.team == true){
            for (let i = 0; i <roomTotalJson[0][companyName]["sections"].length; i++){
                activationList.push(roomTotalJson[0][companyName]["sections"][i]["defensible"]);
            }

        } else {
            for (let i = 0; i <roomTotalJson[0][companyName]["sections"].length; i++){
                activationList.push(roomTotalJson[0][companyName]["sections"][i]["attackable"]);
            }
        }         
    
        socket.emit("Section Activation List", companyName, activationList);
    });

    // Load Matrix Tactic
    socket.on('Load Tactic level', async(companyName, section) => {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

        let returnValue;
        if (socket.team == true) {
            returnValue = roomTotalJson[0][companyName]["penetrationTestingLV"];
            var attackable = roomTotalJson[0][companyName].sections[section]["defensible"];
        } else {
            returnValue = roomTotalJson[0][companyName]["attackLV"];
            var attackable = roomTotalJson[0][companyName].sections[section]["attackable"];
        }

        socket.to(socket.room + socket.team).emit("Get Tactic Level", companyName, attackable, returnValue);
        socket.emit("Get Tactic Level", companyName, attackable, returnValue);
    });

    // Load Matrix Technique
    socket.on('Load Technique', async(companyName, section) => {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

        if (socket.team == true) {
            let techniqueActivation = roomTotalJson[0][companyName]["defenseActive"];
            let tacticLevel = roomTotalJson[0][companyName]["penetrationTestingLV"];

            socket.emit("Get Technique", companyName, techniqueActivation, tacticLevel);
        }
    });


    // Matrix -> Emit Select Technique Num for Tactic Upgrade
    socket.on('Upgrade Tactic', async(companyName, section, attackIndex) => {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        let tacticLevel = roomTotalJson[0][companyName]["penetrationTestingLV"];

        let cardLv;
        let pitaNum = 0;
        if (socket.team == true) {
            cardLv = roomTotalJson[0][companyName]["penetrationTestingLV"][attackIndex];
            if (cardLv < 5) {
                pitaNum = roomTotalJson[0]['whiteTeam']['total_pita'] - config["DEFENSE_" + (attackIndex + 1)]['pita'][cardLv];
                roomTotalJson[0]['whiteTeam']['total_pita'] = pitaNum;
            }
        } else {
            cardLv = roomTotalJson[0][companyName]["attackLV"][attackIndex];
            if (cardLv < 5) {
                pitaNum = roomTotalJson[0]['blackTeam']['total_pita'] - config["ATTACK_" + (attackIndex + 1)]['pita'][cardLv];
                roomTotalJson[0]['blackTeam']['total_pita'] = pitaNum;
            }
        }

        if (pitaNum >= 0 && cardLv < 5) {
            socket.to(socket.room + socket.team).emit('Update Pita', pitaNum);
            socket.emit('Update Pita', pitaNum);

            let techniqueBeActivationList = roomTotalJson[0][companyName]["beActivated"];
            techniqueBeActivationList.length = 0;

            // white team -> 공격을 선택할 수 있도록 함
            // balck team -> tactic 레벨 바로 업그레이드
            if (socket.team == true) {
                let techniqueActivation = roomTotalJson[0][companyName]["defenseActive"];
                socket.emit("Get Technique", companyName, techniqueActivation, tacticLevel);
                socket.emit("Get Select Technique Num", companyName, attackIndex, techniqueActivation, config.ATTACK_UPGRADE_NUM[cardLv], 0);
            } else {
                roomTotalJson[0][companyName]["attackLV"][attackIndex] += 1;

                var attackable = roomTotalJson[0][companyName].sections[section]["attackable"];

                socket.to(socket.room + socket.team).emit("Get Tactic Level", companyName, attackable, roomTotalJson[0][companyName]["attackLV"]);
                socket.emit("Get Tactic Level", companyName, attackable, roomTotalJson[0][companyName]["attackLV"]);
            }

            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

        } else {
            if (pitaNum < 0){
                console.log("업그레이드 실패!! >> pita 부족");
                socket.emit("Short of Money");
            } else if (cardLv >= 5){
                console.log("업그레이드 실패!! >> 만랩 달성");
                socket.emit("Already Max Level");
            }
        }
    });

    // Select Technique
    socket.on('Select Technique', async(companyName, section, categoryIndex, attackIndex) => {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

        let cardLv = roomTotalJson[0][companyName]["penetrationTestingLV"][categoryIndex];
        let techniqueBeActivationList = roomTotalJson[0][companyName]["beActivated"];
        
        if (techniqueBeActivationList.includes(attackIndex)) {
            for(var i = 0; i < techniqueBeActivationList.length; i++){ 
                if (techniqueBeActivationList[i] === attackIndex) { 
                    techniqueBeActivationList.splice(i, 1); 
                    break;
                }
            }
        } else {
            techniqueBeActivationList.push(attackIndex);
        }

        if (techniqueBeActivationList.length == config.ATTACK_UPGRADE_NUM[cardLv]) {
            socket.emit("Complete Select Technique", companyName, categoryIndex);

        } else {
            let techniqueActivation = roomTotalJson[0][companyName]["defenseActive"];
            socket.emit("Get Select Technique Num", companyName, categoryIndex, techniqueActivation, config.ATTACK_UPGRADE_NUM[cardLv], techniqueBeActivationList.length);
        }

        await jsonStore.updatejson(roomTotalJson[0], socket.room);
        roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
    });

    // Select Technique Complete -> Add Active Technique & Upgrade Tactic Level
    socket.on('Select Technique and Upgrade Tactic', async(companyName, section, categoryIndex) => {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

        // 선택 완료
        let tacticLevel = roomTotalJson[0][companyName]["penetrationTestingLV"];
        let attackable = roomTotalJson[0][companyName].sections[section]["attackable"];
        let techniqueBeActivationList = roomTotalJson[0][companyName]["beActivated"];
        let techniqueActivation = roomTotalJson[0][companyName]["defenseActive"];
        let techniqueLevel = roomTotalJson[0][companyName]["sections"][section]["defenseLv"];

        // 유니티에서 완료버튼 클릭 시 수정할 것!
        if (socket.team == true) {
            roomTotalJson[0][companyName]["penetrationTestingLV"][categoryIndex] += 1;
        }

        var alreadyAttackList = [];
        for(var i = 0; i < techniqueBeActivationList.length; i++){ 
            var sectionAttackProgressArr = roomTotalJson[0][companyName].sections[section].attackProgress;

            if (techniqueActivation[categoryIndex][techniqueBeActivationList[i]] == 2) {
                // 0 나중에 시나리오 인덱스로 변경할 것
                let filterAttackProgress = sectionAttackProgressArr.filter(function(progress){
                    return progress.tactic == config.ATTACK_CATEGORY[categoryIndex] && progress.attackName == config.ATTACK_TECHNIQUE[categoryIndex][techniqueBeActivationList[i]];
                });

                var attackJson = {category : categoryIndex, technique : techniqueBeActivationList[i], cooltime : config["DEFENSE_" + (categoryIndex + 1)]["time"][techniqueLevel[categoryIndex][techniqueBeActivationList[i]]],
                                    state : filterAttackProgress[0].state, level : techniqueLevel[categoryIndex][techniqueBeActivationList[i]]};
                alreadyAttackList.push(attackJson);
            }

            techniqueActivation[categoryIndex][techniqueBeActivationList[i]] = 1;
        }

        socket.emit("Get Technique", companyName, techniqueActivation, tacticLevel);
        socket.emit("Get Tactic Level", companyName, attackable, tacticLevel);

        // 여러 공격도 처리될 수 있도록 하기
        for (var i = 0; i < alreadyAttackList.length; i++) {
            DefenseCooltime(socket, alreadyAttackList[i].state, companyName, section, alreadyAttackList[i].category, alreadyAttackList[i].technique, alreadyAttackList[i].level);
            socket.emit('Start Defense', companyName, section, alreadyAttackList[i].category, alreadyAttackList[i].technique, alreadyAttackList[i].cooltime);
        }

        await jsonStore.updatejson(roomTotalJson[0], socket.room);
        roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
    });


    // 회사 몰락 여부 확인
    socket.on('On Main Map', async() => {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

        let abandonStatusList = [];
        for(let company of companyNameList){
            abandonStatusList.push(roomTotalJson[0][company]["abandonStatus"]);
        }

        socket.to(socket.room).emit('Company Status', abandonStatusList);
        socket.emit('Company Status', abandonStatusList);
    })
    

    socket.on('On Monitoring', async(companyName) => {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        let company_blockedNum = 0;

        for (var userId in roomTotalJson[0]["blackTeam"]["users"]){
            if (roomTotalJson[0]["blackTeam"]["users"][userId][companyName]["IsBlocked"] == true){
                company_blockedNum += 1;
            }
        }
    
        socket.to(socket.room+'true').emit("Blocked Num", company_blockedNum);
        socket.emit('Blocked Num', company_blockedNum);
    })

    socket.on("Send Chat", async(chat) => {
        let now_time = new Date();   
        let hours = now_time.getHours();
        let minutes = now_time.getMinutes();
        let timestamp = hours+":"+minutes;

        socket.to(socket.room+socket.team).emit("Update Chat", timestamp, socket.nickname, socket.color, chat);
        socket.emit("Update Chat", timestamp, socket.nickname, socket.color, chat);

        chattingLogger.error('game:chatting', {
            server : server_ip,
            userIP : '192.0.0.1',
            sessionID : socket.sessionID,
            userID : socket.userID,
            nickname : socket.nickname,
            data : {
                roomID : socket.roomID,
                room : socket.room,
                team : socket.team,
                chatting : chat
            } 
        });
    })

    socket.on("Is Abandon Company", async(companyName) => {
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        if (roomTotalJson[0][companyName].abandonStatus) {
            socket.to(socket.room).emit('Abandon Company', companyName);
        }
    })

// ===================================================================================================================
    // [Security Monitoring] 영역 클릭 시 레벨 보이기
    socket.on('Section_Name_NonUP', async(data) => {
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        data = JSON.parse(data);
        var corpName = data.Corp;
        var sectionIdx = data.areaIdx;
        var area_level = sectionIdx.toString() + "-" + (roomTotalJson[0][corpName].sections[sectionIdx].level);
        io.sockets.in(socket.room+'true').emit('Now_Level', corpName, area_level.toString());
    });

    // [Security Monitoring] 영역 클릭 시 -> 유지보수 버튼 클릭 시로 수정 필요
    socket.on('Section_Name', async(data) => {
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var white_total_pita = roomTotalJson[0].whiteTeam.total_pita;
        data = JSON.parse(data);
        var corpName = data.Corp;
        var sectionIdx = data.areaIdx;
        
        if(white_total_pita - config.MAINTENANCE_SECTION_INFO.pita[roomTotalJson[0][corpName].sections[sectionIdx].level] <= 0) {
            socket.emit("Short_of_Money");
        } else {
            // 최대 레벨 확인
            if(roomTotalJson[0][corpName].sections[sectionIdx].level >= config.MAX_LEVEL) { socket.emit("Out of Level"); } 
            else 
            {
                // json 변경 - pita 감소
                var newTotalPita = white_total_pita - config.MAINTENANCE_SECTION_INFO.pita[roomTotalJson[0][corpName].sections[sectionIdx].level]; //pita 감소
                roomTotalJson[0].whiteTeam.total_pita = newTotalPita;
                roomTotalJson[0][corpName].sections[sectionIdx].level += 1; // 레벨 증가
                var attackProgressLen = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress.length;
                newLevel = roomTotalJson[0][corpName].sections[sectionIdx].level;

                // 레벨에 맞게 의심 개수 갱신
                newSusCnt = 0
                switch (newLevel) {
                    case 1: // 1~5개
                        for (var i=0; i<attackProgressLen; i++){
                            newSusCnt = newSusCnt + (Math.floor(Math.random() * 5) + 1);
                        }
                        break;
                    case 2: // 1~3개
                        for (var i=0; i<attackProgressLen; i++){
                            newSusCnt = newSusCnt + Math.floor(Math.random() * 3) + 1;
                        }                            
                        break;
                    case 3: // 0~3개
                        for (var i=0; i<attackProgressLen; i++){
                            newSusCnt = newSusCnt + Math.floor(Math.random() * 4);
                        }                             
                        break;
                    case 4: // 0~2개
                        for (var i=0; i<attackProgressLen; i++){
                            newSusCnt = newSusCnt + Math.floor(Math.random() * 3);
                        } 
                        break;
                    case 5:
                        newSusCnt = attackProgressLen;
                        break;
                }
                roomTotalJson[0][corpName].sections[sectionIdx].suspicionCount = newSusCnt;
                await jsonStore.updatejson(roomTotalJson[0], socket.room);

                var area_level = sectionIdx.toString() + "-" + (roomTotalJson[0][corpName].sections[sectionIdx].level);
                io.sockets.in(socket.room+'true').emit('New_Level', corpName, area_level.toString());
                io.sockets.in(socket.room+'true').emit('Update Pita', newTotalPita);
                io.sockets.in(socket.room+'true').emit('Issue_Count_Update', corpName);
            }
        }
    });


    // [Security Monitoring] 관제 issue Count
    socket.on('Get_Issue_Count', async(corp) => {            
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var corpName = corp;
        var sectionsArr = roomTotalJson[0][corpName].sections;
        var cntArr = [];
        sectionsArr.forEach( async(element, idx) => {
            var sectionData = element.suspicionCount;
            cntArr[idx] = sectionData;
        });
        socket.emit('Issue_Count', cntArr, corpName);
    });


    // [Security Monitoring] MonitoringLog 분석 결과 전송 및 자동 대응
    socket.on('Get_Monitoring_Log', async(corp) => {
        // 피타 확인 및 차감
        const roomTotalJson_pita = JSON.parse(await jsonStore.getjson(socket.room));
        var white_total_pita = roomTotalJson_pita[0].whiteTeam.total_pita;
        var corpName = corp;
        var areaArray = roomTotalJson_pita[0][corpName].sections;
        var totalSuspicionCount = 0;
        areaArray.forEach(element => {
            totalSuspicionCount += element.suspicionCount;
        });
        var totalCharge = (config.ANLAYZE_PER_ATTACKCNT * totalSuspicionCount);
        
        if(white_total_pita - totalCharge <= 0) {
            socket.emit("Short of Money");
        } else {
            var newTotalPita = white_total_pita - totalCharge; //pita 차감
            // 분석 결과 전송
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
            var corpName = corp;
            var sectionsArr = roomTotalJson[0][corpName].sections;
            var logArr = [];
            roomTotalJson[0].whiteTeam.total_pita = newTotalPita;
            await jsonStore.updatejson(roomTotalJson[0], socket.room);

            sectionsArr.forEach( async(element, idx) => {
                var sectionLogData = element.attackProgress;
                sectionLogData.forEach(logElement => {
                    switch (logElement.state) {
                        case 1 :
                            var newLog = {
                                area: areaNameList[idx],
                                tactic: logElement.tactic,
                                attackName: logElement.attackName + " is in progress."
                            }
                            break;
                        case 2 : 
                            var newLog = {
                                area: areaNameList[idx],
                                tactic: logElement.tactic,
                                attackName: logElement.attackName + "has been carried out."
                            }
                            break;
                    }
                    logArr.push(newLog);
                });                
            });
            io.sockets.in(socket.room+'true').emit('Monitoring_Log', logArr, corpName);
            // [GameLog] 로그 추가
            let today = new Date();   
            let hours = today.getHours(); // 시
            let minutes = today.getMinutes();  // 분
            let seconds = today.getSeconds();  // 초
            let now = hours+":"+minutes+":"+seconds;
            var gameLog = {time: now, nickname: "", targetCompany: corpName, targetSection: "", detail: "Log analysis is complete."};
            var logArr = [];
            logArr.push(gameLog);
            io.sockets.in(socket.room+'true').emit('addLog', logArr);

            // 자동대응
            var sectionDefenseActivationArr = roomTotalJson[0][corpName]["defenseActive"];
            sectionsArr.forEach( async(element, sectionIdx) => {
                var sectionDefenseProgressArr = element.defenseProgress;
                var defenseLv = element.defenseLv;
                var sectionAttackData = element.attackProgress;
                sectionAttackData.forEach( async(attackElement) => {
                    console.log(attackElement.tactic, attackElement.attackName);
                    
                    var tacticIndex = config.ATTACK_CATEGORY.indexOf(attackElement.tactic);
                    var techniqueIndex = config.ATTACK_TECHNIQUE[tacticIndex].indexOf(attackElement.attackName);
                    console.log(attackElement.tactic, tacticIndex, attackElement.attackName, techniqueIndex, sectionDefenseActivationArr[tacticIndex][techniqueIndex]);

                    if (sectionDefenseActivationArr[tacticIndex][techniqueIndex] == 1){
                        var newInfo = { tactic: attackElement.tactic, attackName: attackElement.attackName, state: false }; 
                        sectionDefenseProgressArr[tacticIndex].push(newInfo);
                        console.log("sectionDefenseProgressArr - Deactivation: ", sectionDefenseProgressArr);
                        // 0은 나중에 시나리오 인덱스로 변경
                        DefenseCooltime(socket, newInfo.state, corpName, sectionIdx, tacticIndex, techniqueIndex, defenseLv[tacticIndex][techniqueIndex]);
                        socket.emit('Start Defense', corpName, sectionIdx, tacticIndex, techniqueIndex, config["DEFENSE_" + (tacticIndex + 1)]["time"][defenseLv[tacticIndex][techniqueIndex]]);
                    } else if (sectionDefenseActivationArr[tacticIndex][techniqueIndex] == 0) {
                        sectionDefenseActivationArr[tacticIndex][techniqueIndex] = 2;
                        let techniqueLevel = roomTotalJson[0][corpName]["sections"][sectionIdx]["defenseLv"];
                        let tacticLevel = roomTotalJson[0][corpName]["penetrationTestingLV"];
                        socket.emit("Get Technique", corpName, sectionDefenseActivationArr, tacticLevel);
                        console.log("sectionDefenseActivationArr - Deactivation : ", sectionDefenseActivationArr);
                    }

                    await jsonStore.updatejson(roomTotalJson[0], socket.room);
                });
            });

        }
    });
    
    // [Result] 최종 결과 보내기
    socket.on('Get_Final_RoomTotal', async(winTeam) => {
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var finalRoomTotal = {
            blackPita : roomTotalJson[0].blackTeam.total_pita,
            whitePita : roomTotalJson[0].whiteTeam.total_pita,
            winHodu : config.WIN_HODU,
            loseHodu : config.LOSE_HODU,
            tieHodu: config.TIE_HODU,
            winTeam : winTeam
        }         

        var blackUsersInfo = []; 
        var whiteUsersInfo = [];
        let infoJson = {};
        var RoomMembersList =  await redis_room.RoomMembers(socket.room);
        for (const member of RoomMembersList){
            var playerInfo = await redis_room.getMember(socket.room, member);
            if (playerInfo.team == false) {
                infoJson = {UsersID : playerInfo.userID, nickname : playerInfo.nickname, UsersProfileColor : playerInfo.color}
                blackUsersInfo.push(infoJson);
            }
            else {
                infoJson = {UsersID : playerInfo.userID, nickname : playerInfo.nickname, UsersProfileColor : playerInfo.color}
                whiteUsersInfo.push(infoJson);
            }
        }
        io.sockets.emit('playerInfo', blackUsersInfo, whiteUsersInfo, JSON.stringify(finalRoomTotal)); // 플리이어 정보(닉네임, 프로필 색) 배열, 양팀 피타, 호두, 승리팀 정보 전송
    });

    
    socket.on('Finish_Result', async() => {
        await SaveDeleteGameInfo(socket.room);            
    });

    socket.on('click_technique_button', async(data, attackName, tacticName) => {
        if(attackName.includes("\n")) { attackName = attackName.substring(1); }

        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        data = JSON.parse(data);
        var corpName = data.Corp;
        var sectionIdx = data.areaIdx;
        var tacticIdx = taticNamesList.indexOf(tacticName);
        var attackProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;
        var attackLv = roomTotalJson[0][corpName].attackLV[tacticIdx];
        var suspicionCount = roomTotalJson[0][corpName].sections[sectionIdx].suspicionCount;
        var areaLv = roomTotalJson[0][corpName].sections[sectionIdx].level;
        var currentPita = roomTotalJson[0].blackTeam.total_pita;

        if (attackLv == 0) {
            socket.emit('Failed to success level');
            return;
        }

        var lvPita = config["ATTACK_" + (tacticIdx + 1)]["pita"][attackLv - 1];
        if (currentPita - lvPita < 0) {
            socket.emit('Short of Money');
            return;
        }

        roomTotalJson[0].blackTeam.total_pita = currentPita - lvPita;

        var lvCoolTime = config["ATTACK_" + (tacticIdx + 1)]["time"][attackLv - 1];

        // 유니티에 쿨타임 시간(레벨별) 전송
        socket.emit('CoolTime_LV', lvCoolTime, corpName);

        // 공격 중복 확인
        var overlap = false;
        attackProgressArr.forEach(element => {
            if(element.attackName == attackName && element.tactic == tacticName) {
                overlap = true;
                return false;
            }
        });

        if(!overlap) {
            // state 1로 공격 저장
            var newInfo = { tactic: tacticName, attackName: attackName, state: 1 }; 
            attackProgressArr.push(newInfo);
            // 영역 레벨에 따른 의심 개수 갱신
            var fakeCnt = 0;
            switch (areaLv) {
                case 1: // 1~5개
                    fakeCnt = Math.floor(Math.random() * 5) + 1;
                    break;
                case 2: // 1~3개
                    fakeCnt = Math.floor(Math.random() * 3) + 1;
                    break;
                case 3: // 0~3개
                    fakeCnt = Math.floor(Math.random() * 4);
                    break;
                case 4: // 0~2개
                    fakeCnt = Math.floor(Math.random() * 3);
                    break;
            }
            suspicionCount = (suspicionCount + 1) + fakeCnt;
            roomTotalJson[0][corpName].sections[sectionIdx].suspicionCount = suspicionCount;
            await jsonStore.updatejson(roomTotalJson[0], socket.room);

            // 관제 issue Count 갱신 신호 유니티에 전송
            io.sockets.in(socket.room+'true').emit('Issue_Count_Update', corpName);

            // 쿨타임 및 성공 여부 결정(by.성공률)
            AttackCoolTime(socket, (lvCoolTime*1000), corpName, sectionIdx, tacticIdx, attackLv, tacticName, attackName); // (socket, corpName, sectionIdx, attackIdx, tacticIdx, attackLv, tacticName, attackName)
        }
    });
    
    socket.on('disconnect', async function() {
        clearInterval(timerId)
        clearInterval(pitaTimerId);
    });
        
       
        
    // Attack 쿨타임
    async function AttackCoolTime(socket, lvCoolTime, corpName, sectionIdx, tacticIdx, attackLv, tacticName, attackName){
        var attackTime = setTimeout(async function(){
            let prob = config["ATTACK_" + (tacticIdx + 1)]["success"][attackLv] * 0.01;
            let percent = Math.random();
            console.log("prob : ", prob, ", percent : ", percent); 
            prob = 1; // test

            // 공격 성공 (by.성공률)
            if (prob >= percent) {
                let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                var attackProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;
    
                // state 2로 변경
                attackProgressArr.filter( async (element) => {
                    if(element.tactic == tacticName && element.attackName == attackName && element.state == 1) {
                        element.state = 2;
                    }
                })

                roomTotalJson[0][corpName].sections[sectionIdx].attackProgress = attackProgressArr;
                await jsonStore.updatejson(roomTotalJson[0], socket.room);

                // [GameLog] 로그 추가
                let today = new Date();   
                let hours = today.getHours(); // 시
                let minutes = today.getMinutes();  // 분
                let seconds = today.getSeconds();  // 초
                let now = hours+":"+minutes+":"+seconds;
                var gameLog = {time: now, nickname: socket.nickname, targetCompany: corpName, targetSection: areaNameList[sectionIdx], detail: attackName+" is completed."};
                var logArr = [];
                logArr.push(gameLog);
                io.sockets.in(socket.room+'false').emit('addLog', logArr);

                // 시나리오 포함 여부 확인 함수 호출
                CheckScenarioAttack(socket, corpName, sectionIdx, tacticName, attackName); 

            // 공격 실패 (by.성공률)
            } else{
                socket.emit('Failed to success rate');

                let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                var attackProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;

                // state 1인 해당 공격 attackProgress에서 제거
                attackProgressArr.filter(async (element, index) => {
                    if(element.tactic == tacticName && element.attackName == attackName && element.state == 1) {
                        attackProgressArr.splice(index, 1);
                        await jsonStore.updatejson(roomTotalJson[0], socket.room);
                    }
                });
            }
            clearTimeout(attackTime);
        }, lvCoolTime);
    }

    async function CheckScenarioAttack(socket, corpName, sectionIdx, tacticName, attackName){
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var attackSenarioProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackSenarioProgress;
        var attackProgress = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;
        var attackConn = roomTotalJson[0][corpName].sections[sectionIdx].attackConn;
        
        // startAttack인지 확인
        for (var i = 0; i < attackConn.length; i++) {
            var scenarioName = "SCENARIO" + (i + 1);
            var startAttackArr = (Object.values(config[scenarioName].startAttack));

            if(startAttackArr.includes(attackName)) {
                var newInfo = { tactic: tacticName, attackName: attackName }; 
                attackSenarioProgressArr[i].push(newInfo);
                attackConn[i]["startAttack"][attackName] = true;
                socket.emit('Attack Success');
            } else {
                for(key in attackConn[i]) {
                    var attackConnArr = (Object.keys(attackConn[i][key]));
                    if (attackConnArr.includes(attackName)) {
                        if (attackConnArr[attackName] == true) {
                            var newInfo = { tactic: tacticName, attackName: attackName }; 
                            attackSenarioProgressArr[i].push(newInfo);
                            socket.emit('Attack Success');
                        } else {
                            // 나중에 tactic도 같이 필터링해줄 수 있는 방법 찾아야 됨
                            var attackInfo = attackProgress.filter(function(progress){
                                return progress.attackName == attackName && progress.tactic == tacticName;
                            })[0];
                            
                            if (typeof attackInfo != "undefined" && attackInfo.state == 2) {
                                var parents = config[scenarioName].attackConnParent[key];

                                if (typeof parents != "undefined" && parents.length > 0){ 
                                    for (var pIdx = 0; pIdx < parents.length; pIdx++) {
                                        if (attackConn[i][parents[pIdx]][key] == true) {
                                            var newInfo = { tactic: tacticName, attackName: attackName }; 
                                            attackSenarioProgressArr[i].push(newInfo);
                                            attackConn[i][key][attackName] = true;
                                            socket.emit('Attack Success');

                                            var mainAttackArr = (Object.values(config["SCENARIO" + (i+1)].mainAttack));
                                            if (mainAttackArr[mainAttackArr.length -1] == attackName && sectionIdx == 2) {
                                                roomTotalJson[0][corpName].abandonStatus = true;
                                                io.sockets.in(socket.room).emit("Abandon Company", corpName);
                                                AllAbandon(socket, roomTotalJson);
                                            } else if (mainAttackArr[-1] == attackName) {
                                                roomTotalJson[0][corpName].sections[sectionIdx].destroyStatus = true;
                                                roomTotalJson[0][corpName].sections[sectionIdx+1].attackable = true;
                                            }

                                            break;
                                        }
                                    }
                                } else if (startAttackArr.includes(key)) {
                                    var newInfo = { tactic: tacticName, attackName: attackName }; 
                                    attackSenarioProgressArr[i].push(newInfo);
                                    attackConn[i][key][attackName] = true;
                                    socket.emit('Attack Success');
                                }
                            }
                        }
                    }
                }
            }
        }

        roomTotalJson[0][corpName].sections[sectionIdx].attackSenarioProgress = attackSenarioProgressArr;
        await jsonStore.updatejson(roomTotalJson[0], socket.room);
    }

    // Defense 쿨타임
    async function DefenseCooltime(socket, attackStateOrigin, corpName, sectionIdx, tacticIndex, techniqueIndex, defenseLevel){
        var defenseTime = setTimeout(async function(){
            let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            var sectionDefenseProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].defenseProgress;
            var sectionAttackProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;
            var defenseCntArr = roomTotalJson[0][corpName].sections[sectionIdx].defenseCnt;
            var defenseLvArr = roomTotalJson[0][corpName].sections[sectionIdx].defenseLv;;
            
            var attackInfo = sectionAttackProgressArr.filter(function(progress){
                return progress.tactic == config.ATTACK_CATEGORY[tacticIndex] && progress.attackName == config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex];
            })[0];

            if (typeof attackInfo != "undefined") {
                let prob = config["DEFENSE_" + (tacticIndex + 1)]["success"][defenseLevel] * 0.01;
                let percent = Math.random();

                console.log("prob : ", prob, ", percent : ", percent); 

                // 대응 성공
                if (prob >= percent) {
                    // 방어 성공 (attackStateOrigin -> attackState : 1 -> 1 or 2 -> 2)
                    var filterDefenseProgress;
                    for (var senarioIdx = 0; senarioIdx < 5; senarioIdx++) {
                        if (attackStateOrigin == attackInfo.state) {
                            sectionAttackProgressArr = sectionAttackProgressArr.filter(function(progress){
                                return progress.tactic != config.ATTACK_CATEGORY[tacticIndex] || progress.attackName != config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex];
                            });

                            filterDefenseProgress = sectionDefenseProgressArr[senarioIdx].filter(function(progress){
                                return progress.tactic != config.ATTACK_CATEGORY[tacticIndex] || progress.attackName != config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex];
                            });
    
                            defenseCntArr[tacticIndex][techniqueIndex] += 1;
    
                            if (defenseLvArr != 5 & defenseCntArr[tacticIndex][techniqueIndex] > config.DEFENSE_TECHNIQUE_UPGRADE) {
                                defenseLvArr += 1;
                            }
    
                            // [GameLog] 로그 추가
                            let today = new Date();
                            let hours = today.getHours(); // 시
                            let minutes = today.getMinutes();  // 분
                            let seconds = today.getSeconds();  // 초
                            let now = hours+":"+minutes+":"+seconds;
                            var gameLog = {time: now, nickname: "", targetCompany: corpName, targetSection: areaNameList[sectionIdx], detail: config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex]+" response has been completed."};
                            var logArr = [];
                            logArr.push(gameLog);
                            io.sockets.in(socket.room+'true').emit('addLog', logArr);
                            io.sockets.emit('Defense Success');
                            
                        } else {   // 방어 실패
                            console.log("DefenseCooltime - faile!!");
                            automaticDefense(socket, corpName, sectionIdx, tacticIndex, techniqueIndex);
                            return;
                        }
                    }
            
                    roomTotalJson[0][corpName].sections[sectionIdx].attackProgress = sectionAttackProgressArr;
                    roomTotalJson[0][corpName].sections[sectionIdx].defenseProgress[senarioIdx] = filterDefenseProgress;
                    
                    await jsonStore.updatejson(roomTotalJson[0], socket.room);

                } else { // 공격 실패 (성공률로 인해)
                    console.log("Failed due to success rate!!")
                    io.sockets.emit('Failed to success rate');
                    automaticDefense(socket, corpName, sectionIdx, tacticIndex, techniqueIndex);
                    return;
                }
            }

            clearTimeout(defenseTime);
            
        }, config["DEFENSE_" + (tacticIndex + 1)]["time"][defenseLevel] * 1000);
    }    

    // 자동 대응 수행
    async function automaticDefense(socket, companyName, section, tacticIndex, techniqueIndex) {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var sectionAttackProgressArr = roomTotalJson[0][companyName].sections[section].attackProgress;

        var attackInfo = sectionAttackProgressArr.filter(function(progress){
            return progress.tactic == config.ATTACK_CATEGORY[tacticIndex] && progress.attackName == config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex];
        })[0];

        let cardLv;
        let pitaNum = 0;
        if (socket.team == true) {
            cardLv = roomTotalJson[0][companyName]["penetrationTestingLV"][tacticIndex];
            if (cardLv < 5) {
                pitaNum = roomTotalJson[0]['whiteTeam']['total_pita'] - config["DEFENSE_" + (tacticIndex + 1)]['pita'][cardLv];
                roomTotalJson[0]['whiteTeam']['total_pita'] = pitaNum;
            }
        }

        if (pitaNum >= 0 && cardLv < 5) {
            socket.to(socket.room + socket.team).emit('Update Pita', pitaNum);
            socket.emit('Update Pita', pitaNum);

            let techniqueBeActivationList = roomTotalJson[0][companyName]["beActivated"];
            techniqueBeActivationList.length = 0;
            
            let techniqueActivation = roomTotalJson[0][companyName]["defenseActive"];
            let techniqueLevel = roomTotalJson[0][companyName]["sections"][section]["defenseLv"];

            // white team -> 공격을 선택할 수 있도록 함
            DefenseCooltime(socket, attackInfo.state, companyName, section, tacticIndex, techniqueIndex, cardLv);
            socket.emit('Start Defense', companyName, section, tacticIndex, techniqueIndex, config["DEFENSE_1"]["time"][techniqueLevel[tacticIndex][techniqueIndex]]);

            await jsonStore.updatejson(roomTotalJson[0], socket.room);
            roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

        } else {
            if (pitaNum < 0){
                console.log("업그레이드 실패!! >> pita 부족");
                io.sockets.emit("Short of Money");
            } else if (cardLv >= 5){
                console.log("업그레이드 실패!! >> 만랩 달성");
                io.sockets.emit("Already Max Level");
            }
        }

        await jsonStore.updatejson(roomTotalJson[0], socket.room);
        roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
    }


    // 모든 회사가 몰락인지 확인, 몰락이면 게임 종료
    async function AllAbandon(socket, roomTotalJson){
        var gameover = true;
        for(let company of companyNameList){
            if(roomTotalJson[0][company]["abandonStatus"] == false){
                gameover = false;
                break;
            }
        }
        
        var winTeam = false; // 블랙 승리
        if(gameover){
            clearInterval(timerId);
            clearInterval(pitaTimerId);
            io.sockets.in(socket.room).emit('Timer END'); 
            io.sockets.in(socket.room).emit('Load_ResultPage');
            socket.on('Finish_Load_ResultPage', async()=> {
                var blackPitaNum = roomTotalJson[0]["blackTeam"]["total_pita"];
                var whitePitaNum = roomTotalJson[0]["whiteTeam"]["total_pita"];
                var whiteScore = whitePitaNum;
                var blackScore = (5 * 1000) + blackPitaNum;
                io.sockets.in(socket.room).emit('Abandon_Gameover', winTeam, blackScore, whiteScore);
            });
        }
    }

    // 타임오버로 인한 게임 종료 -> 점수계산
    async function TimeOverGameOver(socket, roomTotalJson){
        var aliveCnt = 0;
        for(let company of companyNameList){
            if(roomTotalJson[0][company]["abandonStatus"] == false){
                aliveCnt++;
            }
        }

        var blackPitaNum = roomTotalJson[0]["blackTeam"]["total_pita"];
        var whitePitaNum = roomTotalJson[0]["whiteTeam"]["total_pita"];
        var whiteScore = (aliveCnt * 1000) + whitePitaNum;
        var blackScore = ((5-aliveCnt) * 1000) + blackPitaNum;
        var winTeam = null;
        if(whiteScore >= blackScore){
            winTeam = true;
        } else if (whiteScore < blackScore){
            winTeam = false;
        }
        io.sockets.in(socket.room).emit('Timeout_Gameover', winTeam, blackScore, whiteScore);
    }

    
  // <<TODO>>게임 종료시 게임 정보와 룸 정보를 mongoDB에 저장 후 redis에서 삭제 
  async function SaveDeleteGameInfo(roomPin){        
    // // 게임 정보 저장 (mongoDB)
    // var gameTotalJson = JSON.parse(await jsonStore.getjson(roomPin));
    // var gameTotalScm = new RoomTotalSchema(gameTotalJson[0]);
    // func.InsertGameRoomTotal(gameTotalScm);


    // // 룸 정보 저장 (mongoDB)
    // // 해당 룸의 모든 사용자 정보 가져와 new user 정보 추가 후 update
    // var roomMembersList =  await redis_room.RoomMembers(roomPin);
    // var roomMembersDict = {}

    // var user;
    // for (const member of roomMembersList){
    //     user = await redis_room.getMember(roomPin, member);
    //     roomMembersDict[member] = new User(user);
    // }   

    // // roomInfo 정보
    // var roomInfo = JSON.parse(await redis_room.getRoomInfo(roomPin));
    // var roomInfoScm = new RoomInfo(roomInfo);


    // // 합치기 
    // var roomTotalScm = new RoomInfoTotal({
    //     Users :roomMembersDict, 
    //     Info : roomInfoScm
    // });
    // func.InsertRoomInfoTotal(roomTotalScm);

    // 게임 정보 삭제 (redis)
    await jsonStore.deletejson(roomPin);

     // 룸 정보 삭제 (redis)
    redis_room.deleteRooms(roomPin); 
  }
}
