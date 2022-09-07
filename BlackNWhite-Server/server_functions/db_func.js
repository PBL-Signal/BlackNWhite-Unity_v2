const mongoose = require('mongoose');
const express = require("express");

const RoomTotalSchema = require("../schemas/roomTotal/RoomTotalSchema");
const RoomInfoTotal = require("../schemas/roomTotal/RoomInfoTotal");


//===== Mongo DB ====
//MongoDB 연결
mongoose.connect('mongodb://localhost:27017/blacknWhite'); // 포트번호 뒤에 nodejs는 사용할 DB 이름 (현재는 nodejs DB를 사용)
var db = mongoose.connection;

// 연결 실패
db.on('error', function(){
    console.log('Connection Failed!');
});
// 연결 성공
db.once('open', function() {
    console.log('DB Connected!');
});

// //==============================================================================
func = express();

func.InsertGameRoomTotal = function(gameData){
    console.log('InsertGameRoomTotal 함수 호출');

    var newRoom = new RoomTotalSchema(gameData);
    newRoom.save(function(error, data){
        if(error){
            console.log(error);
        }else{
            console.log('New Game Data Saved!');
        }
    });
}

func.InsertRoomInfoTotal = function(roomData){
    console.log('InsertRoomInfoTotal 함수 호출');

    var newRoom = new RoomInfoTotal(roomData);
    newRoom.save(function(error, data){
        if(error){
            console.log(error);
        }else{
            console.log('New Room Data Saved!');
        }
    });
}

module.exports = func;






// // attack List 상태 불러오기
// func.loadRoomTotalInfo = function(roomPin){
//     console.log('[db_func] loadRoomTotalInfo 함수 호출, settings : ', roomPin);
 
//     return new Promise((resolve)=>{
//         RoomTotalSchema.find({roomPin: roomPin}, function(error, roomTotalInfo){
//             console.log('--- Read Room Total Info ---');
//             if(error){
//                 console.log(error);
//             }else{
//                 console.log("roomTotalInfo load result : ", roomTotalInfo);
//                 resolve(roomTotalInfo);
//             }
//         });
//     });
// }


// // 방 생성 함수 
// func.InsertRoom = function(roomData){
//     console.log('INSERT Room 함수 호출');

//     var newRoom = new Room(roomData);
//     newRoom.save(function(error, data){
//         if(error){
//             console.log(error);
//         }else{
//             console.log('New Room Saved!');
//         }
//     });
// }


// // 유효한 방인지 확인하는  함수 
// func.IsValidRoom = function(roomPin){
//     console.log('IsValidRoom 함수 호출');

//     return new Promise((resolve)=>{
//         Room.find({roomPin: roomPin}, function(error, room){
//             console.log('--- IsValidRoom ---');
//             if(error){
//                 console.log(error);
          
//             }else{
//                 // [ 여기 수정 필요]
//                 if (room.length != 0){
//                     // console.log('room manager!! : ', room[0].manager);
//                     resolve({permission : true, manager : room[0].manager });

//                 } else{
//                     resolve({permission : false, manager : '' });
//                 }
//             }
//         });
//     });
// }


// // waitingRoom _ 방 정보 불러오기
// func.loadRoom= function(roomPin){
//     console.log('[db_func] loadRoom 함수 호출, roomPin : ', roomPin);
 
//     return new Promise((resolve)=>{
//         Room.find({roomPin: roomPin}, function(error, room){
//             console.log('--- loadRoom ---');
//             if(error){
//                 console.log(error);
//             }else{
//                 resolve(room);
//             }
//         });
//     });
// }



// /////////////////////////////////////////////////////////////////////////////////////

// // attack List db 저장
// func.SaveAttackList = function(data){
//     console.log('SaveAttackList 함수 호출');

//     var newList = new AttackList(data);
//     newList.save(function(error, data){
//         if(error){
//             console.log(error);
//         }else{
//             console.log('New AttackList Saved!');
//         }
//     });
// }

// // attack List 상태 불러오기
// func.loadAttackList = function(loadInfo){    // loadInfo = {roomPin : "12345", teamName : teamName};
//     console.log('[db_func] loadAttackList 함수 호출, settings : ', loadInfo.roomPin);
 
//     return new Promise((resolve)=>{
//         AttackList.find({roomPin: loadInfo.roomPin, team: loadInfo.teamName}, function(error, attackList){
//             console.log('--- Read Attack List ---');
//             if(error){
//                 console.log(error);
//             }else{
//                 resolve(attackList[0]);
//             }
//         });
//     });
// }

// func.upgradeAttackLevel = function(data){     // data = { roomPin : roomPin, beforeAttackLevel : beforeAttackLevel, newAttackLevel : newAttackLevel }
//     console.log('[db_func] updateAttackLevel 함수 호출, settings : ', data);

//     return new Promise((resolve)=>{
//         AttackList.update({roomPin: data.roomPin, team: data.teamName, attackCard: data.beforeAttackLevel}, {'attackCard.$': data.newAttackLevel}, function(error, attackList){
//             if(error){
//                 console.log(error);
          
//             }else{
//                 console.log('[Attack List] Upgrade Attack Level Success');
//                 resolve(attackList);
//             }
//         });
//     });
// }

// //  ## Section(Area) 생성 함수 - 게임 시작 시 1번 실행
// func.InsertSection =  function(data){
//     console.log('InsertSection 함수 호출');
//     console.log('[InsertSection] 파라미터 >> ', data);
//     const CorpArray = ["회사A", "회사B", "회사C", "회사D", "회사E"];
//     const AreaArray = ["Area_DMZ", "Area_Interal", "Area_Sec"];


//     var areaData;
//     let k = 0;
//     // i는 회사 수, j는 회사 별 영역 수
//     for(var i=0; i<5; i++){
//         for(var j=0; j<3; j++){
//             areaData = {
//                 Corp : CorpArray[i],
//                 area : AreaArray[j],
//                 level : 0,
//                 vuln : parseInt(Math.random() * 4)
//             };
//             //console.log(areaData);
//             data.sectionInfo[k] = areaData;
//             k++;
//         }
//     }

//     var newSection = new Section(data);
//     newSection.save(function(error, data){
//         if(error){
//             console.log(error);
//         }else{
//             console.log('New Section Saved!>> ');
//         }
//     });
// }

// // ## 전체 영역 정보 read
// func.SelectCrop = function(PIN, corp){
//     return new Promise((resolve)=>{
//         Section.find({roomPin: PIN}, {_id:0, rommPin:0}, function(error, data){
//             if(error){
//                 console.log(error);
//             }else{
//                 var corpSpecific = data[0].sectionInfo.filter(function (object){
//                     return object.Corp == corp;
//                 });

//                 //console.log("[DB func] test : ", corpSpecific);
//                 resolve(corpSpecific);
//             }

//         });

//     });    
// }

// // ## 필요한 영역 정보의 index 찾기?
// func.SelectSectionLevel = function(PIN, corp, area){
//     return new Promise((resolve)=>{
//         Section.find({roomPin: PIN}, function(error, data){
//             if(error){
//                 console.log(error);
          
//             }else{
//                 //console.log("[Section - Click Sction] level : ", data);
//                 var corpSpecificIndex = data[0].sectionInfo.findIndex(function (object){
//                     return object.Corp == corp && object.area == area;
//                 });

//                 let arr = new Array(data, corpSpecificIndex);
//                 resolve(arr);
//             }
//         });
//     });    
// }

// // ## 필요한 영역 정보 중 vuln만 read
// func.SelectSectionVuln = function(PIN, corp, area){
//     return new Promise((resolve)=>{
//         Section.find({roomPin: PIN}, function(error, data){
//             if(error){
//                 console.log(error);
          
//             }else{
//                 var corpSpecific = data[0].sectionInfo.filter(function (object){
//                     return object.Corp == corp && object.area == area;
//                 });
//                 //console.log("[SelectSectionVuln] vuln num : ", corpSpecific);
//                 //console.log("[SelectSectionVuln] vuln num : ", corpSpecific[0].vuln);
//                 resolve(corpSpecific[0]);
//             }
//         });
//     });    
// }

// // ## Area 정보 수정
// func.UpdateSection = function(PIN, corp, area, oldData, newData){
//     console.log('[UpdateSection] UpdateSection 함수 호출');
//     Section.updateOne({roomPin: PIN, Corp: corp, area: area, sectionInfo: oldData}, {'sectionInfo.$': newData}, function(error, data){
//         if(error){
//             console.log(error);
      
//         }else{
//             console.log('[UpdateSection] UpdateArea Success');
//         }
//     });
// }


