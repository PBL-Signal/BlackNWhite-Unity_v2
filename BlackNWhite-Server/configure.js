// Configure File
module.exports = {
    TOTAL_PITA : 100,

    // 상의 후 수정 필요 (테스트용)
    ATTACK_UPGRADE_NUM : [1, 2, 3, 4, 5],

    // 공격
    ATTACK_1 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Reconnaissance"},
    ATTACK_2 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Resource Development"},
    ATTACK_3 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Initial Access"},
    ATTACK_4 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Execution"},
    ATTACK_5 : { pita : [3, 4, 5, 6, 7], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Persistence"},
    ATTACK_6 : { pita : [3, 4, 5, 6, 7], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Privilege Escalation"},
    ATTACK_7 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Defense Evasion"},
    ATTACK_8 : { pita : [4, 5, 6, 7, 8], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Credential Access"},
    ATTACK_9 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Discovery"},
    ATTACK_10 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Lateral Movement"},
    ATTACK_11 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Collection"},
    ATTACK_12 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Command and Control"},
    ATTACK_13 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Exfiltration"},
    ATTACK_14 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Impact"},

    //대응 (나중에 tactic이랑 technique를 분리해야 함)
    DEFENSE_1 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Reconnaissance"},
    DEFENSE_2 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Resource Development"},
    DEFENSE_3 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Initial Access"},
    DEFENSE_4 : { pita : [1, 2, 3, 4, 5], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Execution"},
    DEFENSE_5 : { pita : [3, 4, 5, 6, 7], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Persistence"},
    DEFENSE_6 : { pita : [3, 4, 5, 6, 7], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Privilege Escalation"},
    DEFENSE_7 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Defense Evasion"},
    DEFENSE_8 : { pita : [4, 5, 6, 7, 8], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Credential Access"},
    DEFENSE_9 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Discovery"},
    DEFENSE_10 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Lateral Movement"},
    DEFENSE_11 : { pita : [2, 3, 4, 5, 6], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Collection"},
    DEFENSE_12 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Command and Control"},
    DEFENSE_13 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Exfiltration"},
    DEFENSE_14 : { pita : [5, 6, 7, 8, 9], time : [9, 7, 6, 5, 4], success : [40, 50, 60, 70, 80], name : "Impact"},
    
    DEFENSE_UPGRADE : [0, 20, 40, 60, 80, 100],
    DEFENSE_TECHNIQUE_UPGRADE : [0, 2, 4, 6, 8, 10],

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
    MAINTENANCE_SECTION_INFO : { pita : [40, 80, 120, 200, 320] },

    // 로그 분석(공격 개수 당 피타)
    ANLAYZE_PER_ATTACKCNT : 3,
    
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
    // BUY_SCENARIO: { pita : [100, 1100, 1200, 1300, 1400] },
    // UPGRADE_SCENARIO : { pita : [50, 100, 200, 300, 400] }, // 블랙팀 - 사전 탐색 (어택 시나리오) 0->1 : 50 pita

    BUY_SCENARIO: { pita : [10, 10, 1200, 1300, 1400] },
    UPGRADE_SCENARIO : { pita : [10, 10, 10, 10, 10] }, // 블랙팀 - 사전 탐색 (어택 시나리오) 0->1 : 50 pita
            
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
        },

        'attackConnDetail':
        {
            'Gather Victim Network Information': [
                {'tactic' : "Initial Access", "tacticNum" : 2, "tech" : "Exploit Public-Facing Application"},
                {'tactic' : "Initial Access", "tacticNum" : 2, "tech" : "Phishing"},
                {'tactic' : "Initial Access", "tacticNum" : 2, "tech" : "Valid Accounts"},
            ],

            'Exploit Public-Facing Application' :  [
                {'tactic' : "Execution", "tacticNum" : 3, "tech" : "Command and Scripting Interpreter"},
                {'tactic' : "Execution", "tacticNum" : 3, "tech" : "Software Deployment Tools"},
           ],
            'Phishing' : [
                {'tactic' : "Execution", "tacticNum" : 3, "tech" : "Command and Scripting Interpreter"},
                {'tactic' : "Execution", "tacticNum" : 3, "tech" : "Software Deployment Tools"},
           ],
            'Valid Accounts' :[
                {'tactic' : "Execution", "tacticNum" : 3, "tech" : "Command and Scripting Interpreter"},
                {'tactic' : "Execution", "tacticNum" : 3, "tech" : "Software Deployment Tools"},
           ],
            'Command and Scripting Interpreter' : [
                {'tactic' : "Persistence", "tacticNum" : 4, "tech" : "Account Manipulation"},
                {'tactic' : "Privilege Escalation", "tacticNum" : 5, "tech" : "Scheduled Task/Job"},
            ],
            'Software Deployment Tools' : [
                {'tactic' : "Persistence", "tacticNum" : 4, "tech" : "Account Manipulation"},
                {'tactic' : "Privilege Escalation", "tacticNum" : 5, "tech" : "Scheduled Task/Job"},
            ],
            'Account Manipulation' : [
                {'tactic' : "Defense Evasion", "tacticNum" : 6, "tech" : "Abuse Elevation Control Mechanism"},
                {'tactic' : "Defense Evasion", "tacticNum" : 6, "tech" : "Indirect Command Execution"},
            ],
            'Scheduled Task/Job' : [
                {'tactic' : "Collection", "tacticNum" : 10, "tech" : "Screen Capture"},
                {'tactic' : "Exfiltration", "tacticNum" : 12, "tech" : "Exfiltration Over Alternative Protocol"},
                {'tactic' : "Exfiltration", "tacticNum" : 12, "tech" : "Exfiltration Over Web Service"},
            ],
            'Abuse Elevation Control Mechanism' : [
                {'tactic' : "Credential Access", "tacticNum" : 7, "tech" : "Brute Force"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "Account Discovery"},
            ],
            'Indirect Command Execution' : [
                {'tactic' : "Credential Access", "tacticNum" : 7, "tech" : "Brute Force"},
            ],
            'Screen Capture' : [
                {'tactic' : "Command and Control", "tacticNum" : 11, "tech" : "Communication Through Removable Media"},
            ],
            'Exfiltration Over Alternative Protocol' : [
                {'tactic' : "Impact", "tacticNum" : 13, "tech" :  "Data Encrypted for Impact"},
               ],
            'Exfiltration Over Web Service' : [
                {'tactic' : "Impact", "tacticNum" : 13, "tech" :  "Data Encrypted for Impact"},
            ]
        },

        'attackConnParent': // 키 : 자식 공격, 값 : 자식과 연결 부모 공격들
        {
            'Exploit Public-Facing Application' : ['Gather Victim Network Information'],
            'Phishing' : ['Gather Victim Network Information'],
            'Valid Accounts' : ['Gather Victim Network Information'],


            'Command and Scripting Interpreter' : ['Exploit Public-Facing Application',
                                    'Phishing',
                                    "Valid Accounts"],
            
            'Software Deployment Tools' : ['Exploit Public-Facing Application',
                                    'Phishing',
                                    "Valid Accounts"],

            "Account Manipulation" : ['Command and Scripting Interpreter',
                                    'Software Deployment Tools'],
            
            
            "Scheduled Task/Job" : ['Command and Scripting Interpreter',
                                    'Software Deployment Tools'],

            "Abuse Elevation Control Mechanism" : ['Account Manipulation'],
            "Indirect Command Execution" : ['Account Manipulation'],

            'Screen Capture' : ['Scheduled Task/Job'],

            'Exfiltration Over Alternative Protocol' : ['Scheduled Task/Job'],
            'Exfiltration Over Web Service' : ['Scheduled Task/Job'],
         
            'Account Discovery' :  ['Abuse Elevation Control Mechanism'],
            
            'Brute Force' :  ['Abuse Elevation Control Mechanism',
                            'Indirect Command Execution'],

            "Communication Through Removable Media" :  ['Screen Capture'],

            "Data Encrypted for Impact" : ['Exfiltration Over Alternative Protocol',
                                    'Exfiltration Over Web Service']
        }
        
    },

    SCENARIO2 :{
        'attacks': {
            '0': [],
            '1' : ["Obtain Capabilities"],
            '2' : ["Drive-by Compromise"],
            '3' : ["Native API"],
            '4' : [],
            '5' : [],
            '6' : ["Modify Registry"],
            '7' : ["Brute Force"],
            '8' : ["Browser Bookmark Discovery", "File and Directory Discovery", "Network Share Discovery", "Process Discovery",  "System Information Discovery", "System Network Configuration Discovery", "System Network Connections Discovery"],
            '9' : [],
            '10' : ["Clipboard Data", "Data from Local System"],
            '11' : ["Ingress Tool Transfer"],
            '12' : [],
            '13' : ["Data Destruction","Data Encrypted for Impact", "System Shutdown/Reboot" ],
        },

        'startAttack' : [
            "Obtain Capabilities"
        ],
        
        'mainAttack' : {
            '11' : ["Ingress Tool Transfer"],
            '13' : ["Data Destruction","Data Encrypted for Impact", "System Shutdown/Reboot" ],
        },

        'attackConn' : {
            "Obtain Capabilities" : ["Drive-by Compromise", "Native API"],
            "Drive-by Compromise" : ["Native API"],
            "Native API" : ["Modify Registry"],
            "Modify Registry" : ["Brute Force"],
            "Brute Force" : ["Browser Bookmark Discovery", "File and Directory Discovery", "Network Share Discovery", "Process Discovery",  "System Information Discovery", "System Network Configuration Discovery", "System Network Connections Discovery"],
            "Browser Bookmark Discovery" : ["Clipboard Data"],
            "File and Directory Discovery" : ["Data from Local System"],
            "Network Share Discovery" : ["Data from Local System"],
            "Process Discovery"  : ["Data from Local System"],
            "System Information Discovery" : ["Clipboard Data"],
            "System Network Configuration Discovery" : ["Data from Local System"],
            "System Network Connections Discovery": ["Data from Local System"],
            "Clipboard Data" : ["Ingress Tool Transfer",  "System Shutdown/Reboot"],
            "Data from Local System" : ["Data Destruction","Data Encrypted for Impact", "System Shutdown/Reboot" ],
        },

        'attackConnDetail':
        {
            "Obtain Capabilities" : [
                {'tactic' : "Initial Access", "tacticNum" : 2, "tech" : "Drive-by Compromise"},
                {'tactic' : "Execution", "tacticNum" : 3, "tech" : "Native API"},
            ],
            "Drive-by Compromise" : [
                {'tactic' : "Execution", "tacticNum" : 3, "tech" : "Native API"},
            ],

            "Native API" : [
                {'tactic' : "Defense Evasion", "tacticNum" : 6, "tech" :  "Modify Registry"},
            ],

            "Modify Registry" : [
                {'tactic' : "Credential Access", "tacticNum" : 7, "tech" :   "Brute Force"},
            ],

            "Brute Force" : [
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "Browser Bookmark Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "File and Directory Discovery", },
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "Network Share Discovery" },
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "Process Discovery"  },
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "System Information Discovery" },
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "System Network Configuration Discovery" },
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "System Network Connections Discovery" },
            ],

            "Browser Bookmark Discovery" : [
                {'tactic' : "Collection", "tacticNum" : 10, "tech" : "Clipboard Data"},
            ],
            "File and Directory Discovery" : [
                {'tactic' : "Collection", "tacticNum" : 10, "tech" : "Data from Local System"},
            ],

            "Network Share Discovery" : [
                {'tactic' : "Collection", "tacticNum" : 10, "tech" : "Data from Local System"},
            ],

            "Process Discovery"  : [
                {'tactic' : "Collection", "tacticNum" : 10, "tech" : "Data from Local System"},
            ],

            "System Information Discovery" : [
                {'tactic' : "Collection", "tacticNum" : 10, "tech" : "Clipboard Data"},
            ],
            "System Network Configuration Discovery" : [
                {'tactic' : "Collection", "tacticNum" : 10, "tech" : "Data from Local System"},
            ],
            "System Network Connections Discovery": [
                {'tactic' : "Collection", "tacticNum" : 10, "tech" : "Data from Local System"},
            ],

            "Clipboard Data" : [
                {'tactic' : "Command and Control", "tacticNum" : 11, "tech" : "Ingress Tool Transfer"},
                {'tactic' : "Impact", "tacticNum" : 13, "tech" : "System Shutdown/Reboot"},
            ],
            
            "Data from Local System" : [
                {'tactic' : "Impact", "tacticNum" : 13, "tech" : "Data Destruction"},
                {'tactic' : "Impact", "tacticNum" : 13, "tech" : "Data Encrypted for Impact"},
                {'tactic' : "Impact", "tacticNum" : 13, "tech" : "System Shutdown/Reboot"},
            ]
        },

        'attackConnParent': // 키 : 자식 공격, 값 : 자식과 연결 부모 공격들
        {
            "Drive-by Compromise" : [ "Obtain Capabilities" ],
            "Native API" : ["Obtain Capabilities","Drive-by Compromise"],
            "Modify Registry" : ["Native API"],
            "Brute Force" : ["Modify Registry"],
            "Browser Bookmark Discovery" : ["Brute Force"],
            "File and Directory Discovery": ["Brute Force"], 
            "Network Share Discovery": ["Brute Force"],
            "Process Discovery": ["Brute Force"],
            "System Information Discovery": ["Brute Force"],
            "System Network Configuration Discovery": ["Brute Force"],
            "System Network Connections Discovery": ["Brute Force"],
            "Clipboard Data" : ["Browser Bookmark Discovery", "System Information Discovery"],
            "Data from Local System" : ["File and Directory Discovery", "Network Share Discovery", "Process Discovery",  "System Information Discovery", "System Network Configuration Discovery", "System Network Connections Discovery"],
            "Ingress Tool Transfer" : ["Clipboard Data"],
            "Data Destruction" : ["Data from Local System"],
            "Data Encrypted for Impact" : ["Data from Local System"],
            "System Shutdown/Reboot" : ["Clipboard Data","Data from Local System"]
        }
        
    },

    SCENARIO3 :{
        'attacks': {
            '0': ["Gather Victim Org Information", "Search Victim-Owned Websites"],
            '1' : ["Develop Capabilities"],
            '2' : ["Exploit Public-Facing Application", "External Remote Services" ],
            '3' : [],
            '4' : ["Account Manipulation", "Browser Extensions"],
            '5' : ["Process Injection"],
            '6' : ["Deobfuscate/Decode Files or Information", "Masquerading", "Modify Registry", "Obfuscated Files or Information", "Process Injection" ],
            '7' : ["Adversary-in-the-Middle", "Multi-Factor Authentication Interception"],
            '8' : ["File and Directory Discovery", "Network Sniffing", "Process Discovery", "Query Registry", "System Information Discovery", "System Network Configuration Discovery", "System Service Discovery"],
            '9' : ["Internal Spearphishing"],
            '10' : ["Adversary-in-the-Middle", "Data from Local System"],
            '11' : ["Ingress Tool Transfer", "Remote Access Software"],
            '12' : ["Exfiltration Over C2 Channel"],
            '13' : [],
        },

        'startAttack' : [
            "Gather Victim Org Information", "Search Victim-Owned Websites"
        ],
        
        'mainAttack' : {
            '11' : ["Ingress Tool Transfer", "Remote Access Software"],
            '12' : ["Exfiltration Over C2 Channel"],
        },

        'attackConn' : {
            "Gather Victim Org Information" : ["Exploit Public-Facing Application", "External Remote Services" ],
            "Search Victim-Owned Websites" : ["Develop Capabilities"],
            "Develop Capabilities" : ["Exploit Public-Facing Application", "External Remote Services" ],
            "Exploit Public-Facing Application" : ["Account Manipulation"],
            "External Remote Services" : ["Account Manipulation", "Browser Extensions"],
            "Account Manipulation" :  ["Process Injection"],
            "Browser Extensions" :  ["Process Injection"],
            "Process Injection" : ["Deobfuscate/Decode Files or Information","Multi-Factor Authentication Interception", "Masquerading", "Modify Registry", "Obfuscated Files or Information" ],
            "Deobfuscate/Decode Files or Information" : ["Multi-Factor Authentication Interception"],
            "Masquerading" : [ "Network Sniffing"],
            "Modify Registry" : ["Query Registry"],
            "Obfuscated Files or Information" : ["System Information Discovery", "System Network Configuration Discovery", "System Service Discovery"],
            "Multi-Factor Authentication Interception" : ["File and Directory Discovery", "Process Discovery"],
            "File and Directory Discovery" : ["Internal Spearphishing", "Data from Local System"],
            "Network Sniffing": ["Internal Spearphishing"], 
            "Process Discovery" :["Data from Local System"],
            "Query Registry":["Data from Local System"], 
            "System Information Discovery" : ["Remote Access Software"],
            "System Network Configuration Discovery": ["Remote Access Software"],
            "System Service Discovery" : ["Ingress Tool Transfer"],
            "Internal Spearphishing": ["Adversary-in-the-Middle", "Data from Local System","Exfiltration Over C2 Channel"],
            "Adversary-in-the-Middle" : ["Remote Access Software"], 
            "Data from Local System": ["Ingress Tool Transfer"]
        
        },

        'attackConnDetail':
        {
            "Gather Victim Org Information" : [
                {'tactic' : "Initial Access", "tacticNum" : 2, "tech" : "Exploit Public-Facing Application"},
                {'tactic' : "Initial Access", "tacticNum" : 2, "tech" :  "External Remote Services"},
            ],
            "Search Victim-Owned Websites" : [
                {'tactic' : "Resource Development", "tacticNum" : 1, "tech" :  "Develop Capabilities"},
            ],

            "Develop Capabilities" : [ 
                {'tactic' : "Initial Access", "tacticNum" : 2, "tech" : "Exploit Public-Facing Application"},
                {'tactic' : "Initial Access", "tacticNum" : 2, "tech" :  "External Remote Services"},
            ],
            "Exploit Public-Facing Application" : [
                {'tactic' : "Persistence" , "tacticNum" : 4, "tech" : "Account Manipulation"},
            ],

            "External Remote Services" : [
                {'tactic' : "Persistence" , "tacticNum" : 4, "tech" : "Account Manipulation"},
                {'tactic' : "Persistence" , "tacticNum" : 4, "tech" : "Browser Extensions"},
            ],
            "Account Manipulation" :  [
                {'tactic' : "Privilege Escalation" , "tacticNum" : 5, "tech" : "Process Injection"},
            ],
            "Browser Extensions" :  [
                {'tactic' : "Privilege Escalation" , "tacticNum" : 5, "tech" : "Process Injection"},
            ],

            "Process Injection" : [
                {'tactic' : "Defense Evasion" , "tacticNum" : 6, "tech" :  "Deobfuscate/Decode Files or Information"},
                {'tactic' : "Credential Access" , "tacticNum" : 7, "tech" :  "Multi-Factor Authentication Interception" },
                {'tactic' : "Defense Evasion" , "tacticNum" : 6, "tech" :  "Masquerading" },
                {'tactic' : "Defense Evasion" , "tacticNum" : 6, "tech" :  "Modify Registry", },
                {'tactic' : "Defense Evasion" , "tacticNum" : 6, "tech" :  "Obfuscated Files or Information" },
            ],

            "Deobfuscate/Decode Files or Information" : [
                {'tactic' : "Credential Access" , "tacticNum" : 7, "tech" :  "Multi-Factor Authentication Interception" },
            ],
            "Masquerading" : [
                {'tactic' : "Discovery"  , "tacticNum" : 8, "tech" :  "Network Sniffing"},
            ],
            "Modify Registry" : [
                {'tactic' : "Discovery"  , "tacticNum" : 8, "tech" :  "Query Registry"}
            ],
            "Obfuscated Files or Information" : [
                {'tactic' : "Discovery"  , "tacticNum" : 8, "tech" :    "System Information Discovery"},
                {'tactic' : "Discovery"  , "tacticNum" : 8, "tech" :  "System Network Configuration Discovery"},
                {'tactic' : "Discovery"  , "tacticNum" : 8, "tech" :  "System Service Discovery"}
            ],
            "Multi-Factor Authentication Interception" : [
                {'tactic' : "Discovery"  , "tacticNum" : 8, "tech" :  "File and Directory Discovery"},
                {'tactic' : "Discovery"  , "tacticNum" : 8, "tech" :  "Process Discovery"},
            ],
            "File and Directory Discovery" : [
                {'tactic' : "Lateral Movement"  , "tacticNum" : 9, "tech" : "Internal Spearphishing"},
                {'tactic' : "Collection"   , "tacticNum" : 10, "tech" :"Data from Local System"},
            ],
            "Network Sniffing": [
                {'tactic' : "Lateral Movement"  , "tacticNum" : 9, "tech" : "Internal Spearphishing"},
            ], 
            "Process Discovery" :[
                {'tactic' : "Collection"   , "tacticNum" : 10, "tech" :"Data from Local System"},
            ],
            "Query Registry":[
                {'tactic' : "Collection"   , "tacticNum" : 10, "tech" :"Data from Local System"},
            ], 
            "System Information Discovery" : [
                {'tactic' : "Command and Control"  , "tacticNum" : 11, "tech" :"Remote Access Software"},
            ],
            "System Network Configuration Discovery": [
                {'tactic' : "Command and Control"  , "tacticNum" : 11, "tech" :"Remote Access Software"},
            ],
            "System Service Discovery" : [
                {'tactic' : "Command and Control"  , "tacticNum" : 11, "tech" :"Ingress Tool Transfer"},
            ],
            "Internal Spearphishing": [
                {'tactic' : "Collection"   , "tacticNum" : 10, "tech" :"Adversary-in-the-Middle"},
                {'tactic' : "Collection"   , "tacticNum" : 10, "tech" :"Data from Local System"},
                {'tactic' : "Exfiltration"    , "tacticNum" : 12, "tech" :"Exfiltration Over C2 Channel"},
            ],
            "Adversary-in-the-Middle" : [
                {'tactic' : "Command and Control"  , "tacticNum" : 11, "tech" :"Remote Access Software"},
            ],
            "Data from Local System": [
                {'tactic' : "Command and Control"  , "tacticNum" : 11, "tech" :"Ingress Tool Transfer"},
            ]
        },

        'attackConnParent': // 키 : 자식 공격, 값 : 자식과 연결 부모 공격들
        {
            "Develop Capabilities" : ["Search Victim-Owned Websites"],
            "Exploit Public-Facing Application" : ["Gather Victim Org Information","Develop Capabilities" ],
            "External Remote Services" : ["Gather Victim Org Information","Develop Capabilities" ],
            "Account Manipulation" : [ "Exploit Public-Facing Application",   "External Remote Services" ],
            "Browser Extensions" :  [ "Exploit Public-Facing Application",   "External Remote Services" ],
            "Process Injection" : ["Account Manipulation","Browser Extensions" ],
            "Deobfuscate/Decode Files or Information" : ["Process Injection"],
            "Masquerading" : ["Process Injection"],
            "Modify Registry" :["Process Injection"],
            "Obfuscated Files or Information" : ["Process Injection"],
            "Multi-Factor Authentication Interception" : ["Deobfuscate/Decode Files or Information", "Process Injection"],
            "File and Directory Discovery" : [ "Multi-Factor Authentication Interception"],
            "Network Sniffing": ["Masquerading"],
            "Process Discovery" : [ "Multi-Factor Authentication Interception"],
            "Query Registry": ["Modify Registry"],
            "System Information Discovery" : ["Obfuscated Files or Information"],
            "System Network Configuration Discovery": ["Obfuscated Files or Information"],
            "System Service Discovery" : ["Obfuscated Files or Information"],
            "Internal Spearphishing":  [  "File and Directory Discovery","Network Sniffing"],
            "Adversary-in-the-Middle"  : ["Internal Spearphishing"],
            "Data from Local System": ["Internal Spearphishing","File and Directory Discovery",  "Process Discovery", "Query Registry"],
            "Ingress Tool Transfer" : [   "System Service Discovery" , "Data from Local System"],
            "Remote Access Software" : ["Adversary-in-the-Middle" ,"System Information Discovery", "System Network Configuration Discovery"],
            "Exfiltration Over C2 Channel" : ["Internal Spearphishing"]
        }
        
    },

    SCENARIO4 :{
        'attacks': {
            '0': [],
            '1' : [],
            '2' : ["Drive-by Compromise"],
            '3' : ["Native API"],
            '4' : [],
            '5' : [],
            '6' : ["Modify Registry"],
            '7' : ["Brute Force"],
            '8' : ["Browser Bookmark Discovery", "File and Directory Discovery", "Network Share Discovery", "Process Discovery", "System Information Discovery", "System Network Connections Discovery", "System Owner/User Discovery"],
            '9' : [],
            '10' : ["Clipboard Data", "Data from Local System" ],
            '11' : ["Ingress Tool Transfer"],
            '12' : [],
            '13' : ["Data Destruction","Data Encrypted for Impact", "System Shutdown/Reboot" ],
        },

        'startAttack' : [
            "Drive-by Compromise"
        ],
        
        'mainAttack' : {
            '7' : ["Brute Force"],
            '11' : ["Ingress Tool Transfer"],
            '13' : ["Data Destruction","Data Encrypted for Impact", "System Shutdown/Reboot" ],
        },

        'attackConn' : {
            "Drive-by Compromise" : ["Native API"],
            "Native API" : ["Modify Registry"],
            "Modify Registry" : ["Brute Force","Browser Bookmark Discovery", "File and Directory Discovery", "Network Share Discovery", "Process Discovery", "System Information Discovery", "System Network Connections Discovery", "System Owner/User Discovery"],
            "Browser Bookmark Discovery" : ["Clipboard Data"], 
            "File and Directory Discovery": ["Clipboard Data"],  
            "Network Share Discovery": ["Data from Local System"], 
            "Process Discovery": ["Data from Local System"],  
            "System Information Discovery": ["Data from Local System"], 
            "System Network Connections Discovery": ["Data from Local System"], 
            "System Owner/User Discovery": ["Data from Local System"], 
            "Clipboard Data": [ "System Shutdown/Reboot" ],
            "Data from Local System" : ["Ingress Tool Transfer", "Data Destruction","Data Encrypted for Impact", "System Shutdown/Reboot" ],
        },

        'attackConnDetail':
        {
            "Drive-by Compromise" : [
                {'tactic' : "Execution" , "tacticNum" : 3, "tech" :  "Native API"},
            ],
            "Native API" : [
                {'tactic' : "Defense Evasion" , "tacticNum" : 6, "tech" :  "Modify Registry"},
            ],
            "Modify Registry" : [
                {'tactic' : "Credential Access" , "tacticNum" : 7, "tech" :  "Brute Force"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" :  "Browser Bookmark Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" :  "File and Directory Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" :  "Network Share Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" :  "Process Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" :  "System Information Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" :  "System Network Connections Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" :  "System Owner/User Discovery"},
            ],

            "Browser Bookmark Discovery" : [
                {'tactic' : "Collection"  , "tacticNum" : 10, "tech" : "Clipboard Data"},
            ], 
            "File and Directory Discovery": [
                {'tactic' : "Collection"  , "tacticNum" : 10, "tech" : "Clipboard Data"},
            ], 
            "Network Share Discovery": [
                {'tactic' : "Collection"  , "tacticNum" : 10, "tech" : "Data from Local System"},
            ],  
            "Process Discovery": [
                {'tactic' : "Collection"  , "tacticNum" : 10, "tech" : "Data from Local System"},
            ],    
            "System Information Discovery": [
                {'tactic' : "Collection"  , "tacticNum" : 10, "tech" : "Data from Local System"},
            ],  
            "System Network Connections Discovery": [
                {'tactic' : "Collection"  , "tacticNum" : 10, "tech" : "Data from Local System"},
            ],  
            "System Owner/User Discovery": [
                {'tactic' : "Collection"  , "tacticNum" : 10, "tech" : "Data from Local System"},
            ],  
            "Clipboard Data": [ 
                {'tactic' : "Impact"  , "tacticNum" : 13, "tech" : "System Shutdown/Reboot"},
            ],
            "Data from Local System" : [
                {'tactic' : "Command and Control", "tacticNum" : 11, "tech" : "Ingress Tool Transfer"},
                {'tactic' : "Impact"  , "tacticNum" : 13, "tech" : "Data Destruction"},
                {'tactic' : "Impact"  , "tacticNum" : 13, "tech" : "Data Encrypted for Impact"},
                {'tactic' : "Impact"  , "tacticNum" : 13, "tech" : "System Shutdown/Reboot"},
            ],
        },

        'attackConnParent': // 키 : 자식 공격, 값 : 자식과 연결 부모 공격들
        {
            "Native API" : ["Drive-by Compromise"],
            "Modify Registry" : ["Native API"],
            "Brute Force" : ["Modify Registry" ],
            "Browser Bookmark Discovery" : ["Modify Registry"],
            "File and Directory Discovery" : ["Modify Registry"],
            "Network Share Discovery" : ["Modify Registry"],
            "Process Discovery" : ["Modify Registry"],
            "System Information Discovery" : ["Modify Registry"],
            "System Network Connections Discovery" : ["Modify Registry"],
            "System Owner/User Discovery" : ["Modify Registry"],
            "Clipboard Data" :["Browser Bookmark Discovery", "File and Directory Discovery","System Information Discovery" ],
            "Data from Local System" : ["Network Share Discovery", "Process Discovery", "System Network Connections Discovery", "System Owner/User Discovery" ],
            "Ingress Tool Transfer" : [  "Data from Local System"],
            "Data Destruction" :  [  "Data from Local System"],
            "Data Encrypted for Impact" : [  "Data from Local System"], 
            "System Shutdown/Reboot" : [ "Clipboard Data",  "Data from Local System"],
        }
        
    },

    SCENARIO5 :{
        'attacks': {
            '0': [],
            '1' : [],
            '2' : ["Drive-by Compromise", "Exploit Public-Facing Application"],
            '3' : ["Windows Management Instrumentation"],
            '4' : ["Scheduled Task/Job"],
            '5' : [],
            '6' : ["Deobfuscate/Decode Files or Information", "Modify Registry", "Obfuscated Files or Information" ],
            '7' : [],
            '8' : ["Domain Trust Discovery", "Process Discovery", "Remote System Discovery", "System Network Configuration Discovery", "System Network Connections Discovery", "System Owner/User Discovery", "System Service Discovery"  ],
            '9' : ["Exploitation of Remote Services"],
            '10' : [],
            '11' : ["Proxy"],
            '12' : [],
            '13' : [],
        },

        'startAttack' : [
            "Drive-by Compromise", "Exploit Public-Facing Application"
        ],
        
        'mainAttack' : {
            '9' : ["Exploitation of Remote Services"],
            '11' : ["Proxy"],
        },

        'attackConn' : {
            "Drive-by Compromise": ["Windows Management Instrumentation"],
            "Exploit Public-Facing Application": ["Windows Management Instrumentation"],
            "Windows Management Instrumentation" : ["Scheduled Task/Job"],
            "Scheduled Task/Job" : ["Deobfuscate/Decode Files or Information", "Modify Registry", "Obfuscated Files or Information" ],
            "Deobfuscate/Decode Files or Information" : ["Domain Trust Discovery", "System Network Configuration Discovery",  "System Owner/User Discovery"  ],
            "Modify Registry" : ["Process Discovery"],
            "Obfuscated Files or Information"  : ["Remote System Discovery", "System Network Configuration Discovery", "System Network Connections Discovery", "System Owner/User Discovery", "System Service Discovery"  ],
            "Domain Trust Discovery" : ["Proxy"],
            "Process Discovery" : ["Proxy"],
            "Remote System Discovery" : ["Exploitation of Remote Services"],
            "System Network Configuration Discovery": ["Proxy"],
            "System Network Connections Discovery": ["Proxy"],
            "System Owner/User Discovery": ["Proxy"],
            "System Service Discovery": ["Proxy"]
        },

        'attackConnDetail':
        {
            "Drive-by Compromise": [
                {'tactic' : "Execution", "tacticNum" : 3, "tech" : "Windows Management Instrumentation"},
            ],
            
            "Exploit Public-Facing Application": [   
                {'tactic' : "Execution", "tacticNum" : 3, "tech" : "Windows Management Instrumentation"},
            ],

            "Windows Management Instrumentation" : [
                {'tactic' : "Persistence", "tacticNum" : 4, "tech" : "Scheduled Task/Job"},
            ],
        
            "Scheduled Task/Job" : [
                {'tactic' : "Defense Evasion", "tacticNum" : 6, "tech" : "Deobfuscate/Decode Files or Information"},
                {'tactic' : "Defense Evasion", "tacticNum" : 6, "tech" : "Modify Registry"},
                {'tactic' : "Defense Evasion", "tacticNum" : 6, "tech" : "Obfuscated Files or Information"},
            ],
            
            "Deobfuscate/Decode Files or Information" : [
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "Domain Trust Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "System Network Configuration Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "System Owner/User Discovery"},
            ],
            
            "Modify Registry" : [
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "Process Discovery"},
            ],

            "Obfuscated Files or Information"  : [
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "Remote System Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "System Network Configuration Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" :  "System Network Connections Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "System Owner/User Discovery"},
                {'tactic' : "Discovery", "tacticNum" : 8, "tech" : "System Service Discovery"},
            ],
            "Domain Trust Discovery" : [
                {'tactic' : "Command and Control", "tacticNum" : 11, "tech" : "Proxy"},
            ],
            "Process Discovery" : [
                {'tactic' : "Command and Control", "tacticNum" : 11, "tech" : "Proxy"},
            ],
            "Remote System Discovery" : [
                {'tactic' : "Lateral Movemen", "tacticNum" : 9, "tech" : "Exploitation of Remote Services"},
            ],
            "System Network Configuration Discovery": [
                {'tactic' : "Command and Control", "tacticNum" : 11, "tech" : "Proxy"},
            ],
            "System Network Connections Discovery": [
                {'tactic' : "Command and Control", "tacticNum" : 11, "tech" : "Proxy"},
            ],
            "System Owner/User Discovery": [
                {'tactic' : "Command and Control", "tacticNum" : 11, "tech" : "Proxy"},
            ],
            "System Service Discovery": [
                {'tactic' : "Command and Control", "tacticNum" : 11, "tech" : "Proxy"},
            ],
        },

        'attackConnParent': // 키 : 자식 공격, 값 : 자식과 연결 부모 공격들
        {
            "Windows Management Instrumentation" : ["Drive-by Compromise", "Exploit Public-Facing Application"],
            "Scheduled Task/Job" : ["Windows Management Instrumentation"],
            "Deobfuscate/Decode Files or Information": ["Scheduled Task/Job"],
            "Modify Registry": ["Scheduled Task/Job"],
            "Obfuscated Files or Information" : ["Scheduled Task/Job"],
            "Domain Trust Discovery": ["Deobfuscate/Decode Files or Information"],
            "Process Discovery" : [ "Modify Registry"] ,
            "Remote System Discovery": [ "Modify Registry"] , 
            "System Network Configuration Discovery": [ "Deobfuscate/Decode Files or Information", "Obfuscated Files or Information"] ,
            "System Network Connections Discovery": [ "Obfuscated Files or Information"] ,
            "System Owner/User Discovery": [ "Deobfuscate/Decode Files or Information", "Obfuscated Files or Information"] , 
            "System Service Discovery": [ "Obfuscated Files or Information"] ,
            "Exploitation of Remote Services": [ "Process Discovery" ],
            "Proxy" : ["Domain Trust Discovery",   "Process Discovery","System Network Configuration Discovery", "System Network Connections Discovery",
                        "System Owner/User Discovery", "System Service Discovery" ]
        }
        
    },

    ATTACK_CATEGORY_DICT : {"Reconnaissance" : 0, "Resource Development" : 1, "Initial Access" : 2, "Execution" : 3, "Persistence" : 4 , "Privilege Escalation" : 5 , "Defense Evasion" : 6,
    "Credential Access" :7, "Discovery" : 8, "Lateral Movement" :  9, "Collection" : 10, "Command and Control" : 11, "Exfiltration" : 12, "Impact" : 13},


    ATTACK_CATEGORY : ["Reconnaissance", "Resource Development", "Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion",
                        "Credential Access", "Discovery", "Lateral Movement", "Collection", "Command and Control", "Exfiltration", "Impact"],

    ATTACK_TECHNIQUE : [
        ["Active Scanning", "Gather Victim Host Information", "Gather Victim Identity Information", "Gather Victim Network Information", "Gather Victim Org Information", "Phishing for Information", "Search Closed Sources", "Search Open Technical Databases", "	Search Open Websites/Domains", "Search Victim-Owned Websites"],
        ["Acquire Infrastructure", "Compromise Accounts", "Compromise Infrastructure", "Develop Capabilities", "Establish Accounts", "Obtain Capabilities", "Stage Capabilities"],
        ["Drive-by Compromise", "Exploit Public-Facing Application", "External Remote Services", "Hardware Additions", "Phishing", "Replication Through Removable Media", "Supply Chain Compromise", "Trusted Relationship", "Valid Accounts"],
        ["Command and Scripting Interpreter", "Container Administration Command", "Deploy Container", "Exploitation for Client Execution", "Inter-Process Communication", "Native API", "Scheduled Task/Job", "Shared Modules", "Software Deployment Tools", "System Services", "User Execution", "Windows Management Instrumentation"],
        ["Account Manipulation", "BITS Jobs", "Boot or Logon Autostart Execution", "Boot or Logon Initialization Scripts", "Browser Extensions", "Compromise Client Software Binary", "Create Account", "Create or Modify System Process", "Event Triggered Execution", "External Remote Services", "Hijack Execution Flow", "Implant Internal Image", "Modify Authentication Process", "Office Application Startup", "Pre-OS Boot", "Scheduled Task/Job", "Server Software Component", "Traffic Signaling", "Valid Accounts"],
        ["Abuse Elevation Control Mechanism", "Access Token Manipulation", "Boot or Logon Autostart Execution", "Boot or Logon Initialization Scripts", "Create or Modify System Process", "Domain Policy Modification", "Escape to Host", "Event Triggered Execution", "Exploitation for Privilege Escalation", "Hijack Execution Flow", "Process Injection", "Scheduled Task/Job", "Valid Accounts"],
        ["Abuse Elevation Control Mechanism", "Access Token Manipulation", "BITS Jobs", "Build Image on Host", "Debugger Evasion", "Deobfuscate/Decode Files or Information", "Deploy Container", "Direct Volume Access", "Domain Policy Modification", "Execution Guardrails", "Exploitation for Defense Evasion", "File and Directory Permissions Modification", "Hide Artifacts", "Hijack Execution Flow", "Impair Defenses", "Indicator Removal on Host", "Indirect Command Execution", "Masquerading", "Modify Authentication Process", "Modify Cloud Compute Infrastructure", "Modify Registry", "Modify System Image", "Network Boundary Bridging", "Obfuscated Files or Information", "Plist File Modification", "Pre-OS Boot", "Process Injection", "Reflective Code Loading", "Rogue Domain Controller", "Rootkit", "Subvert Trust Controls", "System Binary Proxy Execution", "System Script Proxy Execution", "Template Injection", "Traffic Signaling", "Trusted Developer Utilities Proxy Execution", "Unused/Unsupported Cloud Regions", "Use Alternate Authentication Material", "Valid Accounts", "Virtualization/Sandbox Evasion", "Weaken Encryption", "XSL Script Processing"],
        ["Adversary-in-the-Middle", "Brute Force", "Credentials from Password Stores", "Exploitation for Credential Access", "Forced Authentication", "Forge Web Credentials", "Input Capture", "Modify Authentication Process", "Multi-Factor Authentication Interception", "Multi-Factor Authentication Request Generation", "Network Sniffing", "OS Credential Dumping", "Steal Application Access Token", "Steal or Forge Kerberos Tickets", "Steal Web Session Cookie", "Unsecured Credentials"],
        ["Account Discovery", "Application Window Discovery", "Browser Bookmark Discovery", "Cloud Infrastructure Discovery", "Cloud Service Dashboard", "Cloud Service Discovery", "Cloud Storage Object Discovery", "Container and Resource Discovery", "Debugger Evasion", "Domain Trust Discovery", "File and Directory Discovery", "Group Policy Discovery", "Network Service Discovery", "Network Share Discovery", "Network Sniffing", "Password Policy Discovery", "Peripheral Device Discovery", "Permission Groups Discovery", "Process Discovery", "Process Discovery", "Query Registry", "Remote System Discovery", "Software Discovery", "System Information Discovery", "System Location Discovery", "System Network Configuration Discovery", "System Network Connections Discovery", "System Owner/User Discovery", "System Service Discovery", "System Time Discovery", "Virtualization/Sandbox Evasion"],
        ["Exploitation of Remote Services", "Internal Spearphishing", "Lateral Tool Transfer", "Remote Service Session Hijacking", "Remote Services", "Replication Through Removable Media", "Software Deployment Tools", "Taint Shared Content", "Use Alternate Authentication Material"],
        ["Adversary-in-the-Middle", "Archive Collected Data", "Audio Capture", "Automated Collection", "Browser Session Hijacking", "Clipboard Data", "Data from Cloud Storage Object", "Data from Configuration Repository", "Data from Information Repositories", "Data from Local System", "Data from Network Shared Drive", "Data from Removable Media", "Data Staged", "Email Collection", "Input Capture", "Screen Capture", "Video Capture"],
        ["Application Layer Protocol", "Communication Through Removable Media", "Data Encoding", "Data Obfuscation", "Dynamic Resolution", "Encrypted Channel", "Fallback Channels", "Ingress Tool Transfer", "Multi-Stage Channels", "Non-Application Layer Protocol", "Non-Standard Port", "Protocol Tunneling", "Proxy", "Remote Access Software", "Traffic Signaling", "Web Service"],
        ["Automated Exfiltration", "Data Transfer Size Limits", "Exfiltration Over Alternative Protocol", "Exfiltration Over C2 Channel", "Exfiltration Over Other Network Medium", "Exfiltration Over Physical Medium", "Exfiltration Over Web Service", "Scheduled Transfer", "Transfer Data to Cloud Account"],
        ["Account Access Removal", "Data Destruction", "Data Encrypted for Impact", "Data Manipulation", "Defacement", "Disk Wipe", "Endpoint Denial of Service", "Firmware Corruption", "Inhibit System Recovery", "Network Denial of Service", "Resource Hijacking", "Service Stop", "System Shutdown/Reboot"]
    ]
  
}