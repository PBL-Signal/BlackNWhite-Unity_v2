const { createLogger, format, transports } = require('winston');
require('winston-mongodb');

const winston = require('winston');

const config = { 
    levels: { // 숫자가 낮으면 순위가 높음
        error: 0,
        debug: 1,
        warn: 2,
        info: 3,
        data: 4,
        verbose: 5,
        silly: 6,
        custom: 7
    },
    colors: { 
        error: 'red',
        debug: 'blue',
        warn: 'yellow',
        info: 'green',
        data: 'magenta',
        verbose: 'cyan',
        silly: 'grey',
        custom: 'yellow'
    }
}

winston.addColors(config.colors); 


const lobbyLogger = createLogger({ // 
    format :format.combine(
        format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
        // 출력 형식 : 로그 레벨(종류) , 날짜-시간, 로그종류 , 로그 세부분류, 서버 이름, ip정보, sessionID, userID, nickname, eventParams
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message} |\t${info.server} - ${info.userIP} |\tSESSION: ${info.sessionID}|\tUSERID: ${info.userID} |\tNICKNAME: ${info.nickname} |\tDATA: ${JSON.stringify(info.data)}`), // 출력 형식 
        format.metadata() ),


    transports:[
        // Console
        new winston.transports.Console({
            format :format.combine(
                format.colorize({ all: true })
            )
        }),

        // File transport
        new transports.File({   // 저장되는 파일 맟 로그 포멧 형식 지정 
            filename: 'logs/lobby.log',
        }),

        // MongoDB transport
        new transports.MongoDB({
            levels: config.levels,
            db : 'mongodb://localhost:27017/logs',
            options: {
                useUnifiedTopology: true
            },
            storeHost: true, //server 이름 저장 (ex. DESKTOP_@##@#2)
            collection: 'lobby_logs',
        })
    ]
});


const gameLogger = createLogger({ // 
    format :format.combine(
        format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
        // 출력 형식 : 로그 레벨(종류) , 날짜-시간, 로그종류 , 로그 세부분류, 서버 이름, ip정보, sessionID, userID, nickname, eventParams
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message} |\t${info.server} - ${info.userIP} |\tSESSION: ${info.sessionID}|\tUSERID: ${info.userID} |\tNICKNAME: ${info.nickname} |\tDATA: ${JSON.stringify(info.data)}`), // 출력 형식 
        format.metadata() ),
        
    transports:[
        // Console
        new winston.transports.Console({
            format :format.combine(
                format.colorize({ all: true })
            )
        }),

        // File transport
        new transports.File({   // 저장되는 파일 맟 로그 포멧 형식 지정 
        filename: 'logs/gameServer.log',
        }),
        
        // MongoDB transport
        new transports.MongoDB({
            levels: config.levels,
            db : 'mongodb://localhost:27017/logs',
            options: {
                useUnifiedTopology: true
            },
            storeHost: true, //server 이름 저장 (ex. DESKTOP_@##@#2)
            collection: 'gameServer_logs',
        })
    ]
});
    
const chattingLogger = createLogger({ // 
    format :format.combine(
        format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
        // 출력 형식 : 로그 레벨(종류) , 날짜-시간, 로그종류 , 로그 세부분류, 서버 이름, ip정보, sessionID, userID, nickname, eventParams
        format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message} |\t${info.server} - ${info.userIP} |\tSESSION: ${info.sessionID}|\tUSERID: ${info.userID} |\tNICKNAME: ${info.nickname} |\tDATA: ${JSON.stringify(info.data)}`), // 출력 형식 
        format.metadata() ),
        
    transports:[
        // Console
        new winston.transports.Console({
            format :format.combine(
                format.colorize({ all: true })
            )
        }),

        // File transport
        new transports.File({   // 저장되는 파일 맟 로그 포멧 형식 지정 
        filename: 'logs/chattingServer.log',
        }),
        
        // MongoDB transport
        new transports.MongoDB({
            levels: config.levels,
            db : 'mongodb://localhost:27017/logs',
            options: {
                useUnifiedTopology: true
            },
            storeHost: true, //server 이름 저장 (ex. DESKTOP_@##@#2)
            collection: 'chattingServer_logs',
        })
    ]
});

module.exports = {
    lobbyLogger: lobbyLogger,
    gameLogger: gameLogger,
    chattingLogger: chattingLogger
};
