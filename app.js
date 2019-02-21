const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const csv = require('csvtojson/v2');


async function run() {
    const archivePath = process.argv[2];

    if (typeof archivePath != 'undefined') {
        let dataSourceDir = extractFiles('./' + archivePath);
        let filePathes = await getFilePathes(dataSourceDir);

        for (let i = 0; i < filePathes.length; i++) {
            parseFile(filePathes[i]);
        }        
    } else {
        console.log('Set file to parse');
    }
};
run();


function extractFiles(archFilePath) {
    let zip = new AdmZip(archFilePath);
    zip.extractAllTo('./tmp/', true);

    return __dirname + '/tmp/';
}

function getFilePathes(targetDir) {
    let filePathes = [];
    return new Promise(function(resolve, reject) {
        fs.readdir(targetDir, (err, files) => {
            if (err) {
                reject(err);
            } else {
                files.forEach(file => {
                    filePathes.push(__dirname + '/tmp/' + file);
                });
                resolve(filePathes);                
            }
        });
    }).catch(err => {
        console.log('Get error: ', err);
    });
};

function parseFile(filePath) {
    const outputFile = path.basename(filePath).split('.').slice(0, -1).join('.') + '.json';
    const file = fs.createWriteStream(outputFile);
    let separator = '';
    
    file.write('[');
    csv({delimiter: '||'})
    .fromFile(filePath)
    .on('data', (data) => {
        userObj = parseUser(JSON.parse(data));
        file.write(separator + JSON.stringify(userObj));
        if (!separator) {
            separator = ',';
        }
    })
    .on('done', (err) => {
        if (err) {
            console.log(err)
        } else {
            file.write(']');            
        }
    })
    .on('error',(err)=>{
        console.log(err)
    })
}

function parseUser(user) {
    return {
        name: user.last_name + ' ' + user.first_name,
        phone: user.phone.replace(/\s*[()-]\s*/g, ''),
        person: {
            firstName: {
                type: user.first_name
            },
            lastName: {
                type: user.last_name
            }
        },
        amount: user.amount,
        date: user.date.split('/').reverse().join('-'),
        costCenterNum: user.cc.replace(/\s*[A-Z]\s*/g, ''),
    }
}
