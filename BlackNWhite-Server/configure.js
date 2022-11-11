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
    }
    },
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