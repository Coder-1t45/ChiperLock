const { randomInt } = require( 'crypto');
const fs = require('fs');
const path = require('path');
const chiper = require('./chiper');
const rsa = require("node-rsa");

//import dont work here

/*settings file exapmle*:
    -----
    -----
    -----
    -----
*/

/*database file example*
    description:"",
    password:"",
    key:{
        n:
        public:
        private:
    }
    database{
        group_name:[
            {title, username, password, url, description}
        ]
    }

*/


/*open file dialog
const {dialog} = require('electron').remote;

document.querySelector('#selectBtn').addEventListener('click', function (event) {
    dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections']
    }, function (files) {
        if (files !== undefined) {
            // handle files
        }
    });
});

*/
class _class{
    static async loadSettings(){

        const json_file = path.join(__dirname,'settings.json');

        if (!fs.existsSync(json_file)){
            let keys = [];
            
            for (let index = 0; index < 6; index++) {
                var rsakes = new rsa().generateKeyPair();

                var publickey = rsakes.exportKey("public");
                var privatekey = rsakes.exportKey("private");

                var n = randomInt(255);
                keys.push([n, publickey, privatekey]);
            }
            
            fs.openSync(json_file,"w");
            fs.writeFileSync(json_file, JSON.stringify(keys), "utf8");

        }

    }

    static async createDatabase(name, location, description, password){
        name = name.endsWith('.cld') ? name : name + '.cld';
        location = path.join(location, name);
        if (!fs.existsSync(location)){

            var rsakes = new rsa().generateKeyPair();
            var _data = {
                description: description,
                password: password,
                keys:[
                    randomInt(255),
                    rsakes.exportKey("public"),
                    rsakes.exportKey("private")
                ],
                database: {}
            }
            fs.openSync(location,"w");
            fs.writeFileSync(location, chiper.encrypt.index(JSON.stringify(_data)), "utf8");
            return [true, _data, location];
        }
        else{
            return [false,null,""];
        }
    }

    //createDatabase("awo","D:/Coding/SimpleToolsForU/GitHub/ChiperLock.backup/Github/result_trying","HELLO MOTHER FUCKER!")
    //console.log(loadDatabase("D:/Coding/SimpleToolsForU/GitHub/ChiperLock.backup/Github/result_trying/awo.cld"));
    static async loadDatabase(location){
        if (fs.existsSync(location)){
            fs.openSync(location,"r");
            var readen_data = fs.readFileSync(location, "utf8");
            return chiper.app.decrypt(JSON.parse(chiper.decrypt.index(readen_data)))
        }
        else throw "Does not Exsist";
    }
    static async saveDatabase(location, data){
        fs.openSync(location,"w");
        fs.writeFileSync(location,
            chiper.encrypt.index(JSON.stringify(chiper.app.encrypt(data)))
            , "utf8");
        return true;
    }
    static newKeys(data){
        var rsakes = new rsa().generateKeyPair();
        data.keys = [
            randomInt(255),
            rsakes.exportKey("public"),
            rsakes.exportKey("private")
        ]
        return data;
    }
    static async checking_method(){ //TODO: delete later!
        var rsakes = new rsa().generateKeyPair();
        
        var d = {
            description: 'whats app!??!',
            password: '123456', //Todo: OPEN DIALOG AND ASK FOR PASSWORD!!;
            keys:[
                randomInt(255),
                rsakes.exportKey("public"),
                rsakes.exportKey("private")
            ],
            database: {
                groupa:[
                    {title: 'string',
                    username: 'string',
                    password: 'string',
                    url: 'string',
                    description: 'string'},
                    {title: 'alebyq',
                    username: 'alebyq',
                    password: 'string',
                    url: 'string',
                    description: 'alebyq'},
                    {title: 'string',
                    username: 'alebyq',
                    password: 'string',
                    url: 'string',
                    description: 'stringifycocs'},
                    {title: 'string',
                    username: 'stringifycocs',
                    password: 'alebyq',
                    url: 'string',
                    description: 'stringifycocs'},
                ]
            }
        }
        var partie =  d.database;
        
        await saveDatabase('D:/Coding/SimpleToolsForU/GitHub/ChiperLock.backup/Github/result_trying/awo.cld', d);
        
        console.log('\n INSIDE TARGET:>>>>\n\n\nStarting to Read:');
        var obj = await loadDatabase("D:/Coding/SimpleToolsForU/GitHub/ChiperLock.backup/Github/result_trying/awo.cld");
        console.log(obj.database['groupa']);
        console.log(JSON.stringify(obj.database) == JSON.stringify(partie));
    }
    static async mergeDatabases(a, b){
        Object.keys(b.database).forEach(_group => {
            if (Object.keys(a.database).includes(_group)){
                b.database[_group].forEach(b_entry => {
                    let did = false;
                    a.database[_group].forEach(a_entry => {
                        if (JSON.stringify(a_entry) == JSON.stringify(b_entry)){
                            did = true;
                        }
                    })
                    if (!did)
                        a.database[_group].push(b_entry)
                        did = true;
                })
                
                //Group do in A
                
            }else{//Group not in A
                a.database[_group] = b.database[_group]
            }
        })
        return a
    }
    static async convertToExcel(_data, _location){
        try{
            var database = _data.database;
            var list = [];
            Object.keys(database).forEach(_group => {
                database[_group].forEach(element => {
                    list.push({...element, group: _group})})})

            
            const ObjectsToCsv = require('objects-to-csv');
            const o = new ObjectsToCsv(list);
            await o.toDisk(_location);
            
            return true;
        }
        catch(err){
            return false;
        }
    
    }
    static async importFromExcel(_location, _data){
        try {
            fs.openSync(_location,"r");
            var readen_data = fs.readFileSync(_location, "utf8");
            const csvToJson = require('csvtojson');
            const arr = await csvToJson().fromString(readen_data);//read file
            var obj = {};
            arr.forEach(element => {
                var _group = element.group;
                delete element.group;
                if (Object.keys(obj).includes(_group)) {
                    obj[_group] = [...obj[_group], element];}
                else {obj[_group] = [element];}
            }); 
            return [true, await this.mergeDatabases(_data, {database:obj})]
        }catch(err){
            return [false, null];
        }
    }
}

module.exports = _class