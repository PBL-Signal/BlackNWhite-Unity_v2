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

    // [MainGame] ?????? ????????? ?????? ?????? ????????? ?????? ??????
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

        // Timer ??????(??????????????????)
        var time = config.GAME_TIME;

        // ?????? ?????? ????????? 
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

        // pita 10??? ???????????? pita ??????
        var pitaInterval= config.BLACK_INCOME.time * 1000; // black, white ????????? * 1000???
        pitaTimerId = setInterval(async function(){
            const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            roomTotalJson[0].blackTeam.total_pita += config.BLACK_INCOME.pita;
            roomTotalJson[0].whiteTeam.total_pita += config.WHITE_INCOME.pita;

            var black_total_pita = roomTotalJson[0].blackTeam.total_pita;
            var white_total_pita = roomTotalJson[0].whiteTeam.total_pita;

            await jsonStore.updatejson(roomTotalJson[0], socket.room);

            console.log("!!! [?????? ??????] black_total_pita : " + black_total_pita + " white_total_pita : " + white_total_pita);
            
            io.sockets.in(socket.room+'false').emit('Update Pita', black_total_pita);
            io.sockets.in(socket.room+'true').emit('Update Pita', white_total_pita);    
        }, pitaInterval);
    });
    

    // [?????????] ??????????????? ????????? ?????? ?????? emit
    socket.on('GetScenarioLv',  async function() {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);
        socket.emit('BroadScenarioLv', scenarioLvList);
    });


        // [?????????] ??????????????? ????????? ????????? 
        socket.on('TryUpgradeScenario',  async function(selectedScenario) {
        //  json ???????????? ??????????????????, ???????????? ?????? ?????? ?????????
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var black_total_pita = roomTotalJson[0].blackTeam.total_pita;
        var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);
        var scenarioLv = scenarioLvList[selectedScenario];

        // ????????? ???????????? ??????
        if (scenarioLv >= 5){
            socket.emit('ResultUpgradeScenario', false);
            return;
        }

        // ?????? ??????
        if (parseInt(black_total_pita) - parseInt(config.UPGRADE_SCENARIO.pita[scenarioLv]) < 0){
            socket.emit('ResultUpgradeScenario', false);
            return;
        };

        // lv ??????????????? ??? pita ?????? ???????????? 
        scenarioLvList[selectedScenario] += 1
        roomTotalJson[0]["blackTeam"]["scenarioLevel"] = scenarioLvList;
        roomTotalJson[0].blackTeam.total_pita = parseInt(roomTotalJson[0].blackTeam.total_pita) - parseInt(config.UPGRADE_SCENARIO.pita[scenarioLv]);
        await jsonStore.updatejson(roomTotalJson[0], socket.room);

        io.sockets.in(socket.room+'false').emit('Update Pita', roomTotalJson[0].blackTeam.total_pita );
        socket.emit('ResultUpgradeScenario', true);
        io.sockets.in(socket.room).emit('BroadScenarioLv', scenarioLvList);
    });

        // [?????????] ??????????????? ????????? ??????
        socket.on('TryBuyScenario',  async function(selectedScenario) {
        //  json ???????????? ??????????????????, ???????????? ?????? ?????? ?????????
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var black_total_pita = roomTotalJson[0].blackTeam.total_pita;
        var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);
        var scenarioLv = scenarioLvList[selectedScenario];

        // ????????? ???????????? ??????
        if (scenarioLv != -1){
            socket.emit('ResultBuyScenario', false);
            return;
        }

        // ?????? ??????
        if (parseInt(black_total_pita) - parseInt(config.BUY_SCENARIO.pita[selectedScenario]) < 0){
            socket.emit('ResultBuyScenario', false);
            return;
        };

        // lv ??????????????? ??? pita ?????? ???????????? 
        scenarioLvList[selectedScenario] += 1
        roomTotalJson[0]["blackTeam"]["scenarioLevel"] = scenarioLvList;
        roomTotalJson[0].blackTeam.total_pita = parseInt(roomTotalJson[0].blackTeam.total_pita) - parseInt(config.UPGRADE_SCENARIO.pita[scenarioLv]);
        await jsonStore.updatejson(roomTotalJson[0], socket.room);

        io.sockets.in(socket.room+'false').emit('Update Pita', roomTotalJson[0].blackTeam.total_pita );
        socket.emit('ResultBuyScenario', true);
        io.sockets.in(socket.room).emit('BroadScenarioLv', scenarioLvList);
    });


    // [?????????] ?????? ????????? ????????? ??????????????? ????????? ????????? 
    socket.on('GetSectAttScenario',  async function(data) {
        var scenarioLv = 0;
        var scenarioNum = data.scenario + 1;
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));  
        
        // ????????? ???????????? ?????? &????????? ???????????? ?????????
        var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);

        if (data.scenario != -1){
            // ???????????? ????????? ?????? ????????? ???????????? ?????? ?????????
            scenarioLv = scenarioLvList[data.scenario];
            console.log("!-- scenarioLv : ", scenarioLvList[data.scenario]);

            var sectScenarioHint = { 
                selectScenario : data.scenario,
                scenarioLv : scenarioLv
            };

            var attackHint = []; 
            var progressAtt = [];

            // ?????? 1. ?????? ?????? ?????? ?????? ?????? (attackSenarioProgress?????????)
            var sectionAttProgSenario = roomTotalJson[0][data.company].sections[data.section].attackSenarioProgress[data.scenario];
        
            sectionAttProgSenario.forEach((value, index, array) => {
                console.log(`${index} :  ${value.attackName}`); 
                    var attIdx = config.ATTACK_CATEGORY_DICT[value.tactic];
                    progressAtt.push    ({'attIdx' : attIdx, 'attack' : value.attackName});
            });

            sectScenarioHint['progressAtt'] = progressAtt;

            // ?????? 2. ????????? ?????? ?????? 
            if (scenarioLv == 1){ 
                // lv1: ??? ?????? ?????? ??????
                for(let i = 0; i <= 13; i++){
                    if(Object.values(config["SCENARIO" +scenarioNum].attacks[i]).length == 0){
                        attackHint[i] =  false;
                    }else{
                        attackHint[i] =  true;
                    }
                }
                sectScenarioHint['isAttacks'] = attackHint;
            }

            if(scenarioLv >= 2){ // lv :2~5 ?????? 
                // lv2: ??? ?????? ?????? ??????
                for(let i = 0; i <= 13; i++){
                    attackHint[i] =  Object.values(config["SCENARIO" +scenarioNum].attacks[i]).length;
                }

                sectScenarioHint['attacksCnt'] = attackHint;
            }

            // lv3 : ?????? ????????? ?????? ????????? GetConnectedAtt?????? ??????

            if(scenarioLv >= 4){ 
                // lv4: ?????? ??????, ????????? ??????
                sectScenarioHint['attacks']=  config["SCENARIO" +scenarioNum].attacks;
                sectScenarioHint['attackConn'] = config["SCENARIO" +scenarioNum].attackConn;
            }

            if(scenarioLv >= 5){ 
                // lv5: ???????????? ??????
                sectScenarioHint['mainAttack'] = config["SCENARIO" +scenarioNum].mainAttack;
            }
        }

        // ?????? ?????????
        let sectScenarioHintJson = JSON.stringify(sectScenarioHint);
        console.log('sectionScenarioJson', sectScenarioHintJson);

        socket.emit('SendSectAttScenario', sectScenarioHintJson);
    });
    

    // [?????????] ????????? ????????? ????????? ?????? ?????? ?????? ????????????
    socket.on('GetConnectedAtt',  async function(data) {
        var scenarioLv = 0;
        var scenarioNum = data.scenario + 1;
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        
        // ????????? ???????????? ?????? &????????? ???????????? ?????????
        var scenarioLvList = Object.values(roomTotalJson[0]["blackTeam"]["scenarioLevel"]);

        // ???????????? ????????? ?????? ????????? ???????????? ?????? ?????????
        scenarioLv = scenarioLvList[data.scenario];
        
        // check1. ?????? 3???????????? ??????
        if(scenarioLv <= 2) return; 

        // check2. ?????? 3?????? ????????? ???????????? ?????? (attackConn ????????? true?????? ???)
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

        // ?????? ?????? ????????????
        var connectedAttHint = {};
        connectedAttHint['attack'] = data.attack;
        connectedAttHint['connection'] = config["SCENARIO" +scenarioNum].attackConnDetail[data.attack];
        let connectedAttJson = JSON.stringify(connectedAttHint);
        socket.emit('SendConnectedAtt', connectedAttJson);
    });


        // [????????????] ?????? ????????? ??????????????? ????????? ????????? 
        socket.on('GetScenario',  async function(data) {
        var scenarioHint = { 
            selectScenario : data.scenario,
        };
        var attackHint = []; 
        var scenarioNum = data.scenario + 1;

        // lv2: ??? ?????? ?????? ??????
        for(let i = 0; i <= 13; i++){
            attackHint[i] =  Object.values(config["SCENARIO" +scenarioNum].attacks[i]).length;
        }
        scenarioHint['attacksCnt'] = attackHint;

        // lv4: ?????? ??????, ????????? ??????
        scenarioHint['attacks']=  config["SCENARIO" +scenarioNum].attacks;
        scenarioHint['attackConn'] = config["SCENARIO" +scenarioNum].attackConn;

        // lv5: ???????????? ??????
        scenarioHint['mainAttack'] = config["SCENARIO" +scenarioNum].mainAttack;
            
        // ?????? ?????????
        let scenarioHintJson = JSON.stringify(scenarioHint);

        socket.emit('SendScenario', scenarioHintJson);
    });

        // [????????????] ????????? ????????? ????????? ?????? ?????? ?????? ????????????
        socket.on('GetConnectedAttAll',  async function(data) {
        var scenarioNum = data.scenario + 1;
        var connectedAttHint = {};

        connectedAttHint['attack'] = data.attack;
        connectedAttHint['connection'] = config["SCENARIO" +scenarioNum].attackConnDetail[data.attack];
        
        let connectedAttJson = JSON.stringify(connectedAttHint);
        socket.emit('SendConnectedAttAll', connectedAttJson);
    });


    ////////////////////////////////////////////////////////////////////////////////////
    // ?????? ?????? ??? ?????????????????? ?????? ?????????
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
                pitaNum = roomTotalJson[0]['whiteTeam']['total_pita'] - config["DEFENSE_UPGRADE"][cardLv];
                roomTotalJson[0]['whiteTeam']['total_pita'] = pitaNum;
            }
        } else {
            cardLv = roomTotalJson[0][companyName]["attackLV"][attackIndex];
            if (cardLv < 5) {
                pitaNum = roomTotalJson[0]['blackTeam']['total_pita'] - config["ATTACK_UPGRADE"][cardLv];
                roomTotalJson[0]['blackTeam']['total_pita'] = pitaNum;
            }
        }

        if (pitaNum > 0 && cardLv < 5) {
            socket.to(socket.room + socket.team).emit('Update Pita', pitaNum);
            socket.emit('Update Pita', pitaNum);

            let techniqueBeActivationList = roomTotalJson[0][companyName]["beActivated"];
            techniqueBeActivationList.length = 0;

            // white team -> ????????? ????????? ??? ????????? ???
            // balck team -> tactic ?????? ?????? ???????????????
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
                console.log("??????????????? ??????!! >> pita ??????");
                socket.emit("Short of Money");
            } else if (cardLv >= 5){
                console.log("??????????????? ??????!! >> ?????? ??????");
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

        // ?????? ??????
        let tacticLevel = roomTotalJson[0][companyName]["penetrationTestingLV"];
        let attackable = roomTotalJson[0][companyName].sections[section]["attackable"];
        let techniqueBeActivationList = roomTotalJson[0][companyName]["beActivated"];
        let techniqueActivation = roomTotalJson[0][companyName]["defenseActive"];
        let techniqueLevel = roomTotalJson[0][companyName]["sections"][section]["defenseLv"];

        // ??????????????? ???????????? ?????? ??? ????????? ???!
        if (socket.team == true) {
            roomTotalJson[0][companyName]["penetrationTestingLV"][categoryIndex] += 1;
        }

        var alreadyAttackList = [];
        for(var i = 0; i < techniqueBeActivationList.length; i++){ 
            var sectionAttackProgressArr = roomTotalJson[0][companyName].sections[section].attackProgress;

            if (techniqueActivation[categoryIndex][techniqueBeActivationList[i]] == 2) {
                // 0 ????????? ???????????? ???????????? ????????? ???
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

        // ?????? ????????? ????????? ??? ????????? ??????
        for (var i = 0; i < alreadyAttackList.length; i++) {
            DefenseCooltime(socket, alreadyAttackList[i].state, companyName, section, alreadyAttackList[i].category, alreadyAttackList[i].technique, alreadyAttackList[i].level);
            socket.emit('Start Defense', companyName, section, alreadyAttackList[i].category, alreadyAttackList[i].technique, alreadyAttackList[i].cooltime);
        }

        await jsonStore.updatejson(roomTotalJson[0], socket.room);
        roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
    });


    // ?????? ?????? ?????? ??????
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
    // [Security Monitoring] ?????? ?????? ??? ?????? ?????????
    socket.on('Section_Name_NonUP', async(data) => {
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        data = JSON.parse(data);
        var corpName = data.Corp;
        var sectionIdx = data.areaIdx;
        var area_level = sectionIdx.toString() + "-" + (roomTotalJson[0][corpName].sections[sectionIdx].level);
        io.sockets.in(socket.room+'true').emit('Now_Level', corpName, area_level.toString());
    });

    // [Security Monitoring] ?????? ?????? ??? -> ???????????? ?????? ?????? ?????? ?????? ??????
    socket.on('Section_Name', async(data) => {
        const roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var white_total_pita = roomTotalJson[0].whiteTeam.total_pita;
        data = JSON.parse(data);
        var corpName = data.Corp;
        var sectionIdx = data.areaIdx;
        
        if(white_total_pita - config.MAINTENANCE_SECTION_INFO.pita[roomTotalJson[0][corpName].sections[sectionIdx].level] <= 0) {
            socket.emit("Short_of_Money");
        } else {
            // ?????? ?????? ??????
            if(roomTotalJson[0][corpName].sections[sectionIdx].level >= config.MAX_LEVEL) { socket.emit("Out of Level"); } 
            else 
            {
                // json ?????? - pita ??????
                var newTotalPita = white_total_pita - config.MAINTENANCE_SECTION_INFO.pita[roomTotalJson[0][corpName].sections[sectionIdx].level]; //pita ??????
                roomTotalJson[0].whiteTeam.total_pita = newTotalPita;
                roomTotalJson[0][corpName].sections[sectionIdx].level += 1; // ?????? ??????
                var attackProgressLen = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress.length;
                newLevel = roomTotalJson[0][corpName].sections[sectionIdx].level;

                // ????????? ?????? ?????? ?????? ??????
                newSusCnt = 0
                switch (newLevel) {
                    case 1: // 1~5???
                        for (var i=0; i<attackProgressLen; i++){
                            newSusCnt = newSusCnt + (Math.floor(Math.random() * 5) + 1);
                        }
                        break;
                    case 2: // 1~3???
                        for (var i=0; i<attackProgressLen; i++){
                            newSusCnt = newSusCnt + Math.floor(Math.random() * 3) + 1;
                        }                            
                        break;
                    case 3: // 0~3???
                        for (var i=0; i<attackProgressLen; i++){
                            newSusCnt = newSusCnt + Math.floor(Math.random() * 4);
                        }                             
                        break;
                    case 4: // 0~2???
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


    // [Security Monitoring] ?????? issue Count
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


    // [Security Monitoring] MonitoringLog ?????? ?????? ?????? ??? ?????? ??????
    socket.on('Get_Monitoring_Log', async(corp) => {
        // ?????? ?????? ??? ??????
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
            var newTotalPita = white_total_pita - totalCharge; //pita ??????
            // ?????? ?????? ??????
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
                                attackName: logElement.attackName + " has been carried out."
                            }
                            break;
                    }
                    logArr.push(newLog);
                });                
            });
            io.sockets.in(socket.room+'true').emit('Monitoring_Log', logArr, corpName);
            
            // issue count ??????
            const roomTotalJsonNew = JSON.parse(await jsonStore.getjson(socket.room));
            var corpName = corp;
            var sectionsArr = roomTotalJsonNew[0][corpName].sections;
            var cntArr = [];
            sectionsArr.forEach( async(element, idx) => {
                var sectionData = element.suspicionCount;
                cntArr[idx] = sectionData;
            });
            socket.emit('Issue_Count', cntArr, corpName);

            // [GameLog] ?????? ??????
            let today = new Date();   
            let hours = today.getHours(); // ???
            let minutes = today.getMinutes();  // ???
            let seconds = today.getSeconds();  // ???
            let now = hours+":"+minutes+":"+seconds;
            var gameLog = {time: now, nickname: "", targetCompany: corpName, targetSection: "", detail: "Log analysis is complete."};
            var logArr = [];
            logArr.push(gameLog);
            io.sockets.in(socket.room+'true').emit('addLog', logArr);

            // ????????????
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
                        console.log("newInfo : ", newInfo);
                        sectionDefenseProgressArr[tacticIndex].push(newInfo);
                        console.log("sectionDefenseProgressArr - Deactivation: ", sectionDefenseProgressArr);
                        // 0??? ????????? ???????????? ???????????? ??????
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
    
    // [Result] ?????? ?????? ?????????
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
        io.sockets.emit('playerInfo', blackUsersInfo, whiteUsersInfo, JSON.stringify(finalRoomTotal)); // ???????????? ??????(?????????, ????????? ???) ??????, ?????? ??????, ??????, ????????? ?????? ??????
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

        // ???????????? ????????? ??????(?????????) ??????
        socket.emit('CoolTime_LV', lvCoolTime, corpName);

        // ?????? ?????? ??????
        var overlap = false;
        attackProgressArr.forEach(element => {
            if(element.attackName == attackName && element.tactic == tacticName) {
                overlap = true;
                return false;
            }
        });

        if(!overlap) {
            // state 1??? ?????? ??????
            var newInfo = { tactic: tacticName, attackName: attackName, state: 1 }; 
            attackProgressArr.push(newInfo);
            // ?????? ????????? ?????? ?????? ?????? ??????
            var fakeCnt = 0;
            switch (areaLv) {
                case 1: // 1~5???
                    fakeCnt = Math.floor(Math.random() * 5) + 1;
                    break;
                case 2: // 1~3???
                    fakeCnt = Math.floor(Math.random() * 3) + 1;
                    break;
                case 3: // 0~3???
                    fakeCnt = Math.floor(Math.random() * 4);
                    break;
                case 4: // 0~2???
                    fakeCnt = Math.floor(Math.random() * 3);
                    break;
            }
            suspicionCount = (suspicionCount + 1) + fakeCnt;
            roomTotalJson[0][corpName].sections[sectionIdx].suspicionCount = suspicionCount;
            await jsonStore.updatejson(roomTotalJson[0], socket.room);

            // ?????? issue Count ?????? ?????? ???????????? ??????
            io.sockets.in(socket.room+'true').emit('Issue_Count_Update', corpName);

            // ????????? ??? ?????? ?????? ??????(by.?????????)
            AttackCoolTime(socket, (lvCoolTime*1000), corpName, sectionIdx, tacticIdx, attackLv, tacticName, attackName); // (socket, corpName, sectionIdx, attackIdx, tacticIdx, attackLv, tacticName, attackName)
        }
    });
    
    socket.on('disconnect', async function() {
        clearInterval(timerId)
        clearInterval(pitaTimerId);
    });
        
       
        
    // Attack ?????????
    async function AttackCoolTime(socket, lvCoolTime, corpName, sectionIdx, tacticIdx, attackLv, tacticName, attackName){
        var attackTime = setTimeout(async function(){
            let prob = config["ATTACK_" + (tacticIdx + 1)]["success"][attackLv - 1] * 0.01;
            let percent = Math.random();
            console.log("attack - prob : ", prob, ", percent : ", percent); 

            // ?????? ?????? (by.?????????)
            if (prob >= percent) {
                let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                var attackProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;
    
                // state 2??? ??????
                attackProgressArr.filter( async (element) => {
                    if(element.tactic == tacticName && element.attackName == attackName && element.state == 1) {
                        element.state = 2;
                    }
                })

                roomTotalJson[0][corpName].sections[sectionIdx].attackProgress = attackProgressArr;
                await jsonStore.updatejson(roomTotalJson[0], socket.room);

                // [GameLog] ?????? ??????
                let today = new Date();   
                let hours = today.getHours(); // ???
                let minutes = today.getMinutes();  // ???
                let seconds = today.getSeconds();  // ???
                let now = hours+":"+minutes+":"+seconds;
                var gameLog = {time: now, nickname: socket.nickname, targetCompany: corpName, targetSection: areaNameList[sectionIdx], detail: attackName+" is completed."};
                var logArr = [];
                logArr.push(gameLog);
                io.sockets.in(socket.room+'false').emit('addLog', logArr);

                // ???????????? ?????? ?????? ?????? ?????? ??????
                CheckScenarioAttack(socket, corpName, sectionIdx, tacticName, attackName); 

            // ?????? ?????? (by.?????????)
            } else{
                socket.emit('Failed to success rate');

                let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
                var attackProgressArr = roomTotalJson[0][corpName].sections[sectionIdx].attackProgress;

                // state 1??? ?????? ?????? attackProgress?????? ??????
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
        
        // startAttack?????? ??????
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
                            // ????????? tactic??? ?????? ??????????????? ??? ?????? ?????? ????????? ???
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

    // Defense ?????????
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

                console.log("white defenseLevel : ", defenseLevel);
                console.log("white - prob : ", prob, ", percent : ", percent); 

                // ?????? ??????
                if (prob >= percent) {
                    // ?????? ?????? (attackStateOrigin -> attackState : 1 -> 1 or 2 -> 2)
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
    
                            io.sockets.emit('Defense Success');
                            
                        } else {   // ?????? ??????
                            console.log("DefenseCooltime - faile!!");
                            automaticDefense(socket, corpName, sectionIdx, tacticIndex, techniqueIndex);
                            return;
                        }
                    }

                    // [GameLog] ?????? ??????
                    let today = new Date();
                    let hours = today.getHours(); // ???
                    let minutes = today.getMinutes();  // ???
                    let seconds = today.getSeconds();  // ???
                    let now = hours+":"+minutes+":"+seconds;
                    var gameLog = {time: now, nickname: "", targetCompany: corpName, targetSection: areaNameList[sectionIdx], detail: config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex]+" response has been completed."};
                    var logArr = [];
                    logArr.push(gameLog);
                    io.sockets.in(socket.room+'true').emit('addLog', logArr);
            
                    roomTotalJson[0][corpName].sections[sectionIdx].attackProgress = sectionAttackProgressArr;
                    roomTotalJson[0][corpName].sections[sectionIdx].defenseProgress[senarioIdx] = filterDefenseProgress;
                    
                    await jsonStore.updatejson(roomTotalJson[0], socket.room);

                } else { // ?????? ?????? (???????????? ??????)
                    console.log("Failed due to success rate!!")
                    // io.sockets.emit('Failed to success rate');
                    automaticDefense(socket, corpName, sectionIdx, tacticIndex, techniqueIndex, defenseLevel);
                    return;
                }
            }

            clearTimeout(defenseTime);
            
        }, config["DEFENSE_" + (tacticIndex + 1)]["time"][defenseLevel] * 1000);
    }    

    // ?????? ?????? ??????
    async function automaticDefense(socket, companyName, section, tacticIndex, techniqueIndex, defenseLevel) {
        let roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
        var sectionAttackProgressArr = roomTotalJson[0][companyName].sections[section].attackProgress;

        var attackInfo = sectionAttackProgressArr.filter(function(progress){
            return progress.tactic == config.ATTACK_CATEGORY[tacticIndex] && progress.attackName == config.ATTACK_TECHNIQUE[tacticIndex][techniqueIndex];
        })[0];

        let prob = config["DEFENSE_" + (tacticIndex + 1)]["success"][defenseLevel] * 0.01;
        let percent = Math.random();

        console.log("prob : ", prob, ", percent : ", percent); 

        // ?????? ??????
        if (prob >= percent) {
            let cardLv;
            let pitaNum = 0;
            if (socket.team == true) {
                cardLv = roomTotalJson[0][companyName]["penetrationTestingLV"][tacticIndex];
                if (cardLv < 5) {
                    pitaNum = roomTotalJson[0]['whiteTeam']['total_pita'] - config["DEFENSE_" + (tacticIndex + 1)]['pita'][cardLv];
                    roomTotalJson[0]['whiteTeam']['total_pita'] = pitaNum;
                }
            }

            if (pitaNum > 0 && cardLv < 5) {
                socket.to(socket.room + socket.team).emit('Update Pita', pitaNum);
                socket.emit('Update Pita', pitaNum);

                let techniqueBeActivationList = roomTotalJson[0][companyName]["beActivated"];
                techniqueBeActivationList.length = 0;
                
                let techniqueActivation = roomTotalJson[0][companyName]["defenseActive"];
                let techniqueLevel = roomTotalJson[0][companyName]["sections"][section]["defenseLv"];

                // white team -> ????????? ????????? ??? ????????? ???
                DefenseCooltime(socket, attackInfo.state, companyName, section, tacticIndex, techniqueIndex, cardLv);
                socket.emit('Start Defense', companyName, section, tacticIndex, techniqueIndex, config["DEFENSE_1"]["time"][techniqueLevel[tacticIndex][techniqueIndex]]);

                await jsonStore.updatejson(roomTotalJson[0], socket.room);
                roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));

            } else {
                if (pitaNum < 0){
                    console.log("??????????????? ??????!! >> pita ??????");
                    io.sockets.emit("Short of Money");
                } else if (cardLv >= 5){
                    console.log("??????????????? ??????!! >> ?????? ??????");
                    io.sockets.emit("Already Max Level");
                }
            }

            await jsonStore.updatejson(roomTotalJson[0], socket.room);

        } else { // ?????? ?????? (???????????? ??????)
            console.log("Failed due to success rate!!")
            // io.sockets.emit('Failed to success rate');
            automaticDefense(socket, companyName, section, tacticIndex, techniqueIndex);
            return;
        }

        roomTotalJson = JSON.parse(await jsonStore.getjson(socket.room));
    }


    // ?????? ????????? ???????????? ??????, ???????????? ?????? ??????
    async function AllAbandon(socket, roomTotalJson){
        var gameover = true;
        for(let company of companyNameList){
            if(roomTotalJson[0][company]["abandonStatus"] == false){
                gameover = false;
                break;
            }
        }
        
        var winTeam = false; // ?????? ??????
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

    // ??????????????? ?????? ?????? ?????? -> ????????????
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

    
  // <<TODO>>?????? ????????? ?????? ????????? ??? ????????? mongoDB??? ?????? ??? redis?????? ?????? 
  async function SaveDeleteGameInfo(roomPin){        
    // // ?????? ?????? ?????? (mongoDB)
    // var gameTotalJson = JSON.parse(await jsonStore.getjson(roomPin));
    // var gameTotalScm = new RoomTotalSchema(gameTotalJson[0]);
    // func.InsertGameRoomTotal(gameTotalScm);


    // // ??? ?????? ?????? (mongoDB)
    // // ?????? ?????? ?????? ????????? ?????? ????????? new user ?????? ?????? ??? update
    // var roomMembersList =  await redis_room.RoomMembers(roomPin);
    // var roomMembersDict = {}

    // var user;
    // for (const member of roomMembersList){
    //     user = await redis_room.getMember(roomPin, member);
    //     roomMembersDict[member] = new User(user);
    // }   

    // // roomInfo ??????
    // var roomInfo = JSON.parse(await redis_room.getRoomInfo(roomPin));
    // var roomInfoScm = new RoomInfo(roomInfo);


    // // ????????? 
    // var roomTotalScm = new RoomInfoTotal({
    //     Users :roomMembersDict, 
    //     Info : roomInfoScm
    // });
    // func.InsertRoomInfoTotal(roomTotalScm);

    // ?????? ?????? ?????? (redis)
    await jsonStore.deletejson(roomPin);

     // ??? ?????? ?????? (redis)
    redis_room.deleteRooms(roomPin); 
  }
}
