const max = 65535;
const rsa = require("node-rsa");

const _prefix = "QOaCWHh9HONsrgWBrbb42x1PygKdEB5hq5tRIXlwOEMTh3QopMOV0xjshri72X.O/ha75Y6D0RezBaWacK0ErkKvqmEOWiMtkkCxKIuTBORSK3PWkIkvJPePLkaIdfcNRUPvebr0l0ftNtlrKDIy04FsvdXqPVUVB3nekKES3P8ateyVLe6FF2UDqtSAOPCN0YqZaJA0Uqfae0xwXACou/7yOrQtm.FsZrvi7T.0RsYOVWGJausuIiShZ9LOAeHYu8Qk7YvEOZdjG2SfOW6vwtLU/bZtCRIGbJs4j4eTYWVhrLteXsduC9xnKPzThiaUSSRrL68158Gr6li.btXeXvUUg9PFYEaKiZvIZVGtwJcqfEe";
// export type Password = {
//     [key: string]: string;
//     title: string,
//     username: string,
//     password: string,
//     url: string,
//     description: string
// }
// export type Database = {
//     description:string,
//     password:string,
//     keys:[
//         n:number,
//         _public:string,
//         _private:string
//     ],
//     database:{[key: string]: Password[];}
// } 
// export type EncryptedDatabase = {
//     description:string,
//     password:string,
//     keys:[
//         number,
//         string,
//         string
//     ],
//     database:{[key: string]: string[];}
// } 

class _class{
    static index_encryption(str) {
        var output = "";
        for (let index = 0; index < str.length; index++) {
            output += String.fromCharCode( (str.charCodeAt(index) + index) % max );
        }
        return output;
    }
    static index_decryption(str) {
        var output = "";
        for (let index = 0; index < str.length; index++) {
            output += String.fromCharCode( (str.charCodeAt(index) - index) % max );
        }
        return output;
    }
    static object_encryption(data){
        var out = {
            description: data.description,
            password:data.password,
            keys:data.keys,
            database:{

        }
        }
        //_prefix.substring(0,data.keys[0])
        for (const [group, passwords] of Object.entries(data.database))
        {
            passwords.forEach((element, index) => {
                if (!(group in out.database)){
                    out.database[group] = []
                }
                out.database[group][index] = this.smart_encryption(this.password_encryption(element, data.keys[0]), data.keys[0],data.keys[1], data.keys[2]);
            });
        }
        return out;
    }
    static password_encryption(password,k){
        var [a, b, c] = [26, 62, 19];
        for (const [key, pass] of Object.entries(password)){
            //password[key] = module_encryption(password[key], c);
            //password[key] = module_encryption(password[key], b);
            if (key == 'password'){
                password[key] = _prefix.substring(0,k)  + password[key]
            }
            password[key] = this.ceasar_encryption(password[key], a * 9);
            password[key] = this.ceasar_encryption(password[key], b * 2);
            password[key] = this.ceasar_encryption(password[key], c * 52);
            password[key] = this.index_encryption(password[key]);
            
        }
        return JSON.stringify(password);
    }
    static object_decryption(data){
        var out = {
            description: data.description,
        password:data.password,
        keys:data.keys,
        database:{
        }
        }
        
        for (const [group, passwords] of Object.entries(data.database))
        {
            passwords.forEach((element, index) => {
                if (!(group in out.database)){
                    out.database[group] = []
                }
                out.database[group][index] = this.password_decryption(this.smart_decryption(element, data.keys[0],data.keys[1], data.keys[2]), data.keys[0]);
            });
        }
        return out;
    }
    static password_decryption(str, k){
        var [a, b, c] = [26, 62, 19];
        var password = JSON.parse(str);
        for (const [key, pass] of Object.entries(password)){

            
            password[key] = this.index_decryption(password[key]);
            password[key] = this.ceasar_decryption(password[key], c * 52);
            password[key] = this.ceasar_decryption(password[key], b * 2);
            password[key] = this.ceasar_decryption(password[key], a * 9);
            if (key == 'password'){
                password[key] = password[key].substring(k)
            }
            //password[key] = module_decryption(password[key], b);
            //password[key] = module_decryption(password[key], c);
        }
        return password;
    }
    //encryptions
    static ceasar_encryption(text, n){
        var result = '';
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode((text.charCodeAt(i) + n) % max);
        }
        return result;
    }
    static module_encryption(text, n){
        var result = '';
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode((text.charCodeAt(i) * n) % max);
        }
        return result;
    }
    static smart_encryption(text, n, _public, _private){
        var rsakes = new rsa();
        
        rsakes.importKey(_private);

        return rsakes.encryptPrivate(
            this.ceasar_encryption(
                this.module_encryption(
                    this.ceasar_encryption(
                        rsakes.encryptPrivate(text, "base64"),n), 
                    n
                ), 
                n*2
            )
            ,"base64");
    }
    //decryptions:
    static ceasar_decryption(text, n){
        var result = '';
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode((text.charCodeAt(i) - n) % max);
        }
        return result;

    }
    static module_decryption(text, n){

        var result = '';
        for (var i = 0; i < text.length; i++) {
            result += String.fromCharCode((text.charCodeAt(i) + (max * (text.charCodeAt(i) % n))) / n);
        }
        return result;
    }
    static smart_decryption(text, n, _public, _private){
        var rsakes = new rsa();
        
        rsakes.importKey(_public);

        return rsakes.decryptPublic(
            this.ceasar_decryption(
                this.module_decryption(
                    this.ceasar_decryption(rsakes.decryptPublic(text,"utf8"), n * 2), n), n)
        ,"utf8")
    }

    static encrypt = {
        index: (str) => {return this.index_encryption(str)}
    };
    static decrypt ={
        index: (str) => {return this.index_decryption(str)}
    };
    static app ={
        encrypt: (data) => {return this.object_encryption(data)},
        decrypt: (data) => {return this.object_decryption(data)}
    };
}


module.exports = _class