// Configure File
module.exports = {
    TOTAL_PITA : 100,

    // 상의 후 수정 필요 (테스트용)
    ATTACK_UPGRADE_NUM : [1, 2, 3, 4, 5],

    // 공격
    ATTACK_1 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Reconnaissance"},
    ATTACK_2 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Resource Development"},
    ATTACK_3 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Initial Access"},
    ATTACK_4 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Execution"},
    ATTACK_5 : { pita : [3, 4, 5, 6, 7], time : [9, 7, 6, 5, 4], name : "Persistence"},
    ATTACK_6 : { pita : [3, 4, 5, 6, 7], time : [9, 7, 6, 5, 4], name : "Privilege Escalation"},
    ATTACK_7 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Defense Evasion"},
    ATTACK_8 : { pita : [4, 5, 6, 7, 8], time : [9, 7, 6, 5, 4], name : "Credential Access"},
    ATTACK_9 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Discovery"},
    ATTACK_10 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Lateral Movement"},
    ATTACK_11 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Collection"},
    ATTACK_12 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], name : "Command and Control"},
    ATTACK_13 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], name : "Exfiltration"},
    ATTACK_14 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], name : "Impact"},

    //대응
    RESPONSE_1 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Reconnaissance"},
    RESPONSE_2 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Resource Development"},
    RESPONSE_3 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Initial Access"},
    RESPONSE_4 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Execution"},
    RESPONSE_5 : { pita : [3, 4, 5, 6, 7], time : [9, 7, 6, 5, 4], name : "Persistence"},
    RESPONSE_6 : { pita : [3, 4, 5, 6, 7], time : [9, 7, 6, 5, 4], name : "Privilege Escalation"},
    RESPONSE_7 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Defense Evasion"},
    RESPONSE_8 : { pita : [4, 5, 6, 7, 8], time : [9, 7, 6, 5, 4], name : "Credential Access"},
    RESPONSE_9 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Discovery"},
    RESPONSE_10 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Lateral Movement"},
    RESPONSE_11 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Collection"},
    RESPONSE_12 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], name : "Command and Control"},
    RESPONSE_13 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], name : "Exfiltration"},
    RESPONSE_14 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], name : "Impact"},
    
    // 관제 시간
    MONITORING_1 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Reconnaissance"},
    MONITORING_2 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Resource Development"},
    MONITORING_3 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Initial Access"},
    MONITORING_4 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], name : "Execution"},
    MONITORING_5 : { pita : [3, 4, 5, 6, 7], time : [9, 7, 6, 5, 4], name : "Persistence"},
    MONITORING_6 : { pita : [3, 4, 5, 6, 7], time : [9, 7, 6, 5, 4], name : "Privilege Escalation"},
    MONITORING_7 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Defense Evasion"},
    MONITORING_8 : { pita : [4, 5, 6, 7, 8], time : [9, 7, 6, 5, 4], name : "Credential Access"},
    MONITORING_9 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Discovery"},
    MONITORING_10 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Lateral Movement"},
    MONITORING_11 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], name : "Collection"},
    MONITORING_12 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], name : "Command and Control"},
    MONITORING_13 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], name : "Exfiltration"},
    MONITORING_14 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], name : "Impact"},
    
    GAME_TIME : 30, // 현재 단위 분, 추후 수정
    MAX_LEVEL : 5,
    BLACK_MIN_LEVEL : 0,
    WHITE_MIN_LEVEL : 1,
    
    WARNING_CNT : 3,
    
    // 사후관리
    UNBLOCK_INFO : { pita : 50, time : [15, 14, 13, 12, 11] },
    DETECTION_CNT_PER_LEVEL : [6, 5, 4, 3, 2],
    
    // 영역과 공격의 레벨 차에 따른 지연 시간
    DELAY_TIME_PERCENT : [1, 1.5, 1.8, -1, -1],
    
    // 유지보수
    MAINTENANCE_SECTION_INFO : { pita : [5, 6, 7, 8, 9] },
    
    // 사전탐색
    EXPLORE_INFO : { pita : 10, time : 10 },
    
    // 수입원
    BLACK_INCOME : { pita : 50, time : 10 },
    WHITE_INCOME : { pita : 100, time : 10 },
    
    // 방 생성 인원 기본 값
    DEFAULT_ROOM : { maxPlayer : 8 },
    // 대기룸 maxPlayer에 따른 UI 위치 
    ALLOCATE_PLAYER_UI : { 2 : '1', 4 : '21', 6 : '321', 8 : '4321'},

    // 게임 시작시 제출 호두
    DUES_HODU : 100,

    // 승리팀 획득 호두
    WIN_HODU : 200,

    // 패배팀 획득 호두
    LOSE_HODU : 100,

    // 무승부 획득 호두
    TIE_HODU : 150,

    // 승패 결정 기준(몰락된 회사 갯수)
    BENCHMARK: 3,

    // const COMPANY_1 = { name : "" , sectionVuln=Rand_Vuln(sectionNum) }; // section 인덱스 = 영역 idx
    // const COMPANY_2 = { name : "" , section=["ATTACK_2", "ATTACK_3",  "ATTACK_1"] };
    
    /*
    function Rand_Vuln(Numsection){
        var vulnArr = [];
    
        for(var i=0; i<Numsection; i++) {
                parseInt(Math.random() * 4)
                vulnArr.append("ATTACK_" + i.)
        }
    
        return vulnArr
    }
    */

   /**
    *  버전 2 configure
    */
    BUY_SCENARIO: { pita : [1000, 1100, 1200, 1300, 1400] },
    UPGRADE_SCENARIO : { pita : [50, 100, 200, 300, 400] }, // 블랙팀 - 사전 탐색 (어택 시나리오) 0->1 : 50 pita
            
    SCENARIO1 :{
        'attacks': {
            '0': ["Gather Victim Network Information"],
            '1' : [],
            '2' : ["Exploit Public-Facing Application", "Phishing", "Valid Accounts"],
            '3' : ["Command and Scripting Interpreter", "Software Deployment Tools"],
            '4' : ["Account Manipulation"],
            '5' : ["Scheduled Task/Job"],
            '6' : ["Abuse Elevation Control Mechanism", "Debugger Evasion", "Indirect Command Execution"],
            '7' : ["Brute Force"],
            '8' : ["Account Discovery"],
            '9' : [],
            '10' : ["Screen Capture"],
            '11' : ["Communication Through Removable Media"],
            '12' : ["Exfiltration Over Alternative Protocol", "Exfiltration Over Web Service"],
            '13' : ["Data Encrypted for Impact"],
        },

        'startAttack' : [
            "Gather Victim Network Information"
        ],
        
        'mainAttack' : {
            '6' : ["Debugger Evasion"],
            '7' : ["Brute Force"],
            '8' : ["Account Discovery"],
            '11' : ["Communication Through Removable Media"],
            '13' : ["Data Encrypted for Impact"],
        },

        'attackConn' : {
           'Gather Victim Network Information': ["Exploit Public-Facing Application", "Phishing", "Valid Accounts"],
           'Exploit Public-Facing Application' :  ["Command and Scripting Interpreter", "Software Deployment Tools"],
            'Phishing' : ["Command and Scripting Interpreter", "Software Deployment Tools"],
            'Valid Accounts' : ["Command and Scripting Interpreter", "Software Deployment Tools"],
            'Command and Scripting Interpreter' : ["Account Manipulation", "Scheduled Task/Job"],
            'Software Deployment Tools' : ["Account Manipulation", "Scheduled Task/Job"],
            'Account Manipulation' : ["Abuse Elevation Control Mechanism", "Indirect Command Execution"],
            'Scheduled Task/Job' : ["Screen Capture","Exfiltration Over Alternative Protocol","Exfiltration Over Web Service"],
            'Abuse Elevation Control Mechanism' : ["Brute Force", "Account Discovery"],
            'Indirect Command Execution' : ["Brute Force"],
            'Screen Capture' : ["Communication Through Removable Media"],
            'Exfiltration Over Alternative Protocol' : ["Data Encrypted for Impact"],
            'Exfiltration Over Web Service' : ["Data Encrypted for Impact"]
        }

    }
    // SCENARIO1 :{
    //     'attacks': {
    //         '0': [[0,3]],
    //         '1' : [],
    //         '2' : [[2,1], [2,4], [2,8]],
    //         '3' : [[3,0], [3,8]],
    //         '4' : [[4,0]],
    //         '5' : [[5,11]],
    //         '6' : [[6,0], [6,4], [6,16]],
    //         '7' : [[7,1]],
    //         '8' : [[8,0]],
    //         '9' : [],
    //         '10' : [[10,15]],
    //         '11' : [[11,1]],
    //         '12' : [[12,2],[12,6]],
    //         '13' : [[13,2]],
    //     },

    //     'startAttack' : [
    //         [0,3]
    //     ],
        
    //     'mainAttack' : [
    //         [7,1], [8,0], [11,1], [13,2]
    //     ],

    //     'attackConn' : {
    //        '[0,3]': [[2,1], [2,4], [2,8]],
    //        '[2,1]' :  [[3,0], [3,8]],
    //         '[2,4]' : [[3,0], [3,8]],
    //         '[2,8]' : [[3,0], [3,8]],
    //         '[3,0]' : [[4,0], [5,11]],
    //         '[3,8]' : [[4,0], [5,11]],
    //         '[4,0]' : [[6,0], [6,16]],
    //         '[5,11]' : [[10,15],[12,2],[12,6]],
    //         '[6,0]' : [[7,1], [8,0]],
    //         '[6,16]' : [[7,1]],
    //         '[10,15]' : [[11,1]],
    //         '[12,2]' : [[13,2]],
    //         '[12,6]' : [[13,2]]
    //     }

    // }
  
}