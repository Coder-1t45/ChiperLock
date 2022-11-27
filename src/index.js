//current file system
//value
const {ipcRenderer} = require('electron')

//aplication Data
let f_location = "";
let f_database = null;
let c_database = null;
let locked = false;
//context
const app = {
    window: { // name of the js
        close: () => ipcRenderer.send("program/close"), //handle functions
        minimize: () => ipcRenderer.send("program/minimize"),
        screen: () => ipcRenderer.send("program/screen")
    },
    developer:{
        opentools: () => ipcRenderer.send('developer/tools')
    },
    database: {
        new: (_name, _location, _password, _description) => ipcRenderer.send('data/new', [_name, _location, _description, _password]), //4
        load: (_password) => ipcRenderer.send("data/load", [_password]), // 0
        save: () =>  ipcRenderer.send("data/save",  [f_location ,c_database]), // 1
        saveas: () =>  ipcRenderer.send("data/saveas", [c_database]), // 2
        changekeys: () => ipcRenderer.send("data/changekeys", [c_database]), // 3
        merge: (_password) => ipcRenderer.send('data/merge', [c_database, _password]) //5
    },
    excel: {
        import: () => ipcRenderer.send('excel/import', [c_database]),//6
        export: () => ipcRenderer.send('excel/export', [c_database])//7
    }

}



//app variables
let darkmode = false;
let context = document.getElementById('context');
let userinput = document.getElementById('userinput');
let mousePosition = [0,0]
let __input_condition = 0;
let __keyboard_occupied = false;

function check_occupied(){
    let el = document.activeElement;

    if (el && (el.tagName.toLowerCase() == 'input'||
        el.tagName.toLowerCase() == 'textarea')) {
        keyboard_occupied = true;
    } 
    else {
        keyboard_occupied = false;
    }
  
}
//app intervals:
let interval_updated = null;

function timer(ms) { 
    return new Promise(res => setTimeout(res, ms)); 
}
async function user_input(placeholder=""){
    userinput = document.getElementById('userinput')
    userinput.placeholder = placeholder;
    userinput.style.visibility = 'visible';


    while (__input_condition == 0){
        
        await timer(100)
    }
    if (__input_condition === -1){
        __input_condition = 0;
        userinput.style.visibility = 'hidden';
        userinput.value = '';
        return [false, '']
    }

    else{
        __input_condition = 0;
        var _data = userinput.value;
        userinput.style.visibility = 'hidden';
        userinput.value = '';
        return [true, _data]
    }
}
function __sumbit_input(e){
    if(e && e.keyCode == 13)
        __input_condition = 1;
    else if (e && e.keyCode == 27) {
        __input_condition = -1;
    }
}

//Logs:
function extractLocation(){
    var a = f_location.replace(/\\/g,'/');
    var b = a.split('/');
    var _name = b[b.length-1];
    var _folder = a.substring(0, a.length - 1 - _name.length);
  
    return [_folder, _name]
}

function database_log(result_func, c_data=null){
    var screen = document.getElementById('.databaselog');
  screen.style.visibility = 'visible';

  var datascreen = document.getElementById('.dataviewer');
  datascreen.style.visibility = 'hidden';
  
  var _name = document.getElementById('d/name');
  var _location = document.getElementById('d/location');
  var _description = document.getElementById('d/description');
  var _password = document.getElementById('d/password');
  if (c_data != null) {
    [_location.value,_name.value] = extractLocation();
    _location.disabled=true;
    _name.disabled=true;
    _password.value = c_data.password;
    _description.ariaValueNow = c_data.description;
  }
  else{
  [_name.value, _location.value, _description.value, _password.value] = ['','','',''];}

  var save_btn = document.getElementById('.data.save');
  var cancel_btn = document.getElementById('.data.cancel');
  
  cancel_btn.onclick = () =>{
    screen.style.visibility = 'hidden';
    datascreen.style.visibility = 'visible';
  }

  save_btn.onclick = () =>{
    result_func(_name.value, _location.value, _password.value, _description.value);
    screen.style.visibility = 'hidden';
    datascreen.style.visibility = 'visible';
  }
}
function entry_log(result_fnc, c_data = null){
    var screen = document.getElementById('11');
    
    var datascreen = document.getElementById('12');
    screen.removeAttribute('selected')
    datascreen.setAttribute('selected','')
    
    var _title = document.getElementById('e/title');
    var _username = document.getElementById('e/username');
    var _password = document.getElementById('e/password');
    var _url = document.getElementById('e/url');
    var _description = document.getElementById('e/description');
  
    if (c_data != null) {
      _title.value = c_data.title;
      _username.value = c_data.username;
      _password.value = c_data.password;
      _url.value = c_data.url;
      _description.value = c_data.description;
    }
    else [_title.value, _username.value, _password.value, _url.value, _description.value] = ['','','','',''];
    var save_btn = document.getElementById('.entry.save');
    var cancel_btn = document.getElementById('.entry.cancel');
    
    cancel_btn.onclick = () =>{
  
      datascreen.removeAttribute('selected')
      screen.setAttribute('selected','')
    }
  
    save_btn.onclick = () =>{
      result_fnc(_title.value, _username.value, _password.value, _url.value, _description.value);
      datascreen.removeAttribute('selected')
      screen.setAttribute('selected','')
    }
  }

//current and selected:

let selected_element = {
    element:document.body,
    type:''
}
let selected_group = '';

function _selected_click(_element, _type){
    if (selected_element.element) 
        selected_element.element.style='';
    selected_element.element = _element;
    selected_element.type = _type;
    selected_element.element.style=_type=='e'?'background-color: var(--second-nav);':'';
    if (_type == 'g'){
        selected_group = _element.innerHTML;
        document.getElementById('.group_name_title').innerHTML = selected_group;
        //TODO: display
        display_entries();
        display_groups();
    }
}
const clear_context = () => {
    var parent = document.getElementById('context')
    while (parent.firstChild)
    {
        parent.removeChild(parent.lastChild)
    }
}
const display_context = (list) =>{
    clear_context();
    var parent = document.getElementById('context')
    list.forEach(element => {
        if (Array.isArray(element)){
            var [_text, _function] = element;
            var x = document.createElement('button')
            x.innerHTML = _text;
            x.onmousedown = _function;
        }
        else{
            if (element === 'hr') {
                var x = document.createElement('hr')
            }
        }
        if (x) {
            parent.appendChild(x)
        }

    });
}
const display_groups = () => {
    var _groupParent = document.getElementById('10')
    while (_groupParent.firstChild) {
        _groupParent.removeChild(_groupParent.lastChild);
      }
    var l = document.createElement("p");
    l.innerHTML = 'Groups';
    _groupParent.append(l);
    if (!f_location) return;
    Object.keys(c_database.database).forEach(element=>{
        var x = document.createElement("li"); 
        x.innerHTML=element;
        x.onclick=()=>_selected_click(x, 'g');
        x.oncontextmenu = () => {
            _selected_click(x,'g');
            display_context([
                ['Edit Group', () =>{edit_group()}],
                ['Clone Group', () =>{clone_group()}],
                ['Delete Group', () =>{delete_group()}],
            ])
        }
        if (selected_group == element) {
            x.style='background-color: var(--li-hover); color:white;';
        }_groupParent.append(x);
    })
}
const display_entries=()=>{
    var _parent= document.getElementById('11');
        while (_parent.firstChild){
            _parent.removeChild(_parent.lastChild);
        }
        if (!c_database || !selected_group) return;
            c_database.database[selected_group].forEach((value,id) => {
                if (value){
                    var x = document.getElementById('duplicate_entry_11').cloneNode(true);
                    if (selected_element.type == 'e' && selected_element.element.ariaLabel == id)
                        x.setAttribute('current',1)
                    x.children[0].innerHTML = value.title;
                    x.children[1].innerHTML = value.username;
                    x.children[2].innerHTML = "●".repeat(value.password.length);
                    x.ariaLabel = id;
                    x.id='';
                    x.onclick=()=>{
                        _selected_click(x, 'e');
                    }
                    x.ondblclick=()=>{
                        edit_entry();
                    }
                    x.oncontextmenu = () => {
                        _selected_click(x,'e');
                        display_context([
                            ['Edit Entry', () =>{edit_entry()}],
                            ['Clone Entry', () =>{clone_entry()}],
                            ['Delete Entry', () =>{delete_entry()}],
                            'hr',
                            ['Copy Username', () =>{copy_username()}],
                            ['Copy Password', () =>{copy_password()}]
                        ])
                    }
                    x.style=""
                    
                    _parent.append(x)
                }
            }
        )
}

//bars functions:
//database screen
function new_database(){
    database_log(app.database.new);
};
async function open_database(){
    document.getElementById('maintheonepiece').className='disabled';
    //"123456" -> pass
    var pass = await user_input('Enter Database Password')
    if (pass[0])
        app.database.load(pass[1]);
    else {
        document.getElementById('maintheonepiece').className='';
    }
};
function edit_database(){
    if (locked) return;
    if (c_database)
    
    database_log((_name, _location, _password, _description)=>{
        c_database.password = _password;
        c_database.description = _description;
    }, c_database)
};

function save_database(){
    if (locked) return;
    if (c_database)
    app.database.save();
};
function save_database_as(){
    if (locked) return;
    if (c_database)
    app.database.saveas();
};

function close_database(){
    f_location = '';
  f_database = null;
  c_database = null;
  selected_element.element = null;
  display_entries();
  display_groups();
};
async function lock_database(){
    if (!c_database) return;
    document.getElementById('maintheonepiece').className='disabled';
    locked = true;
    _password = await user_input('Enter Database Password');
    if (_password[0] && c_database.password == _password[1] )
        {document.getElementById('maintheonepiece').className='';
        locked = false;
    }else { 
        lock_database();
    }
};
function switch_keys(){
    if (locked || !c_database) return;
    app.database.changekeys();
}
function _import(){
    if (locked || !c_database) return;
    app.excel.import();
};
function _export(){
    if (locked || !c_database) return;
    app.excel.export();
};
async function merge_database(){
    if (locked || !c_database) return;
    document.getElementById('maintheonepiece').className='disabled';
    var _second_password = await user_input('Second Database Password');
    if (!_second_password[0]) {document.getElementById('maintheonepiece').className=''; return;}
    app.database.merge(_second_password[1]);
};
function _close(){
    app.window.close();
};

//entry screens
function new_entry(){
    if (locked || !selected_group) return;
    entry_log((_title, _username,_password,_url,_description)=>{
        
        c_database.database[selected_group].push({
            title:_title,
            username:_username,
            password:_password,
            url:_url,
            description: _description
        })
        display_entries();
    })
};
function edit_entry(){
    if (locked) return;
    if (!c_database) return;
  if (selected_element.element == null || selected_element.type != 'e' || selected_element.element.ariaLabel == null) return;
  var c_id = parseInt(selected_element.element.ariaLabel.toString());
  var c_data = c_database.database[selected_group][c_id];
  entry_log(
    (_title, _username, _password, _url, _description)=>{
      if (!c_database) return;
      
      c_database.database[selected_group][c_id]= {
        title:_title,
        username:_username,
        password:_password,
        url:_url,
        description: _description
        };
        display_entries();
    },c_data
  )
  
};
function clone_entry(){
    if (locked) return;
    if (!c_database) return;
  if (selected_element.element === null || selected_element.type !== 'e') return;
  var c_id = parseInt(selected_element.element.ariaLabel);
  var c_data = JSON.parse(JSON.stringify( c_database.database[selected_group][c_id]));
  c_database.database[selected_group].push(c_data);
  display_entries();
};
function delete_entry(){
    if (locked) return;
    if (!c_database) return;
    if (selected_element.element === null || selected_element.type !== 'e') return;
    var c_id = parseInt(selected_element.element.ariaLabel);
    c_database.database[selected_group].splice(c_id,1);
    display_entries();
};
function copy_username(){
    if (locked) return;
    if (!c_database) return;
  if (selected_element.element === null || selected_element.type !== 'e') return;
  var c_id = parseInt(selected_element.element.ariaLabel);
  var c_data = c_database.database[selected_group][c_id];
  if (c_data)
  navigator.clipboard.writeText(c_data.username);
};
function copy_password(){
    if (locked) return;
    if (!c_database) return;
  if (selected_element.element === null || selected_element.type !== 'e') return;
  var c_id = parseInt(selected_element.element.ariaLabel);
  var c_data = c_database.database[selected_group][c_id];
  if (c_data)
  navigator.clipboard.writeText(c_data.password);
};

//input user
async function new_group(){
    if (locked) return;
    if (!c_database) return;
    var _name = await user_input("Enter GroupName:");
    if (!_name[0]) return;
    c_database.database[_name[1]] = [];
    display_groups();
  };
  async function edit_group(){
    if (locked) return;
    if (!c_database) return;
    var _name =  await user_input("Edit GroupName:");
    if (!_name[0]) return;
    if (selected_element.element === null || selected_element.type !== 'g') return;
  
    var previus_name = selected_element.element.innerHTML;
    var entries = c_database.database[previus_name];
  
    c_database.database[_name[1]] = entries;
  
    delete c_database.database[previus_name]; 
    //delete the key and value
    display_groups();
  };
  async function clone_group(){
    if (locked) return;
    if (!c_database) return;
    var _name =  await user_input("Cloned GroupName:");
    if (!_name[0]) return;
    if (selected_element.element === null || selected_element.type !== 'g') return;
  
    var previus_name = selected_element.element.innerHTML;
    var entries = JSON.parse(JSON.stringify(c_database.database[previus_name]));
  
    c_database.database[_name[1]] = entries;
    display_groups();
  };
  function delete_group(){
    if (locked || !c_database) return;
    if (selected_element.element === null || selected_element.type !== 'g') return;
    var previus_name = selected_element.element.innerHTML;
    delete c_database.database[previus_name]; 
    if (previus_name == selected_group) selected_group = ''
    display_groups();
    display_entries();
  };

function tools_themes(){
    darkmode = !darkmode;
    document.body.setAttribute('darkmode', darkmode? 'true' : 'false' );
};

function tools_emailus(){
    window.location.href='mailto:simpletoolsforyou@helper.com';
};


//window ready function
window.onload = ()=>{
    const defult_context= () =>{
        
        display_context([
            ["Themes",tools_themes],
            ["Email Us", tools_emailus],
            ["Developer", app.developer.opentools],
            "hr",
            ["Close", _close]
        ]) ;
    }
    defult_context();
    const check_equal = () => {
        return JSON.stringify(f_database) == JSON.stringify(c_database);
    }

    interval_updated = setInterval(()=>{
        document.getElementById('.title').innerHTML = f_location? extractLocation()[1] + (check_equal() ? '' : ' *') : 'Didnt Chose A File';
        check_occupied();
    }, 100);
    
    context = document.getElementById('context');
    userinput = document.getElementById('userinput');
    
    context.style.visibility = 'hidden';

    window.oncontextmenu = (e) => {
        e.preventDefault();
        context.focus();
        context.style.visibility = 'visible';
        context.style.top = (mousePosition[1] * 100 / window.innerHeight).toString() + '%';
        context.style.left = (mousePosition[0] * 100 / window.innerWidth).toString() + '%';
    }

    window.onmousedown = (e) => {
        if (document.activeElement.id != context.id){
            context.style.visibility = 'hidden';
            if (document.activeElement.hasAttribute('context')) {
                defult_context();
            }
            else {
                clear_context();
            }
        }

    }

    window.onmousemove = (e) => {
        mousePosition = [e.clientX,e.clientY];
    }

}

//responses: dont list unpack the data its undoable
const response_data_load = (data) => {
    c_database = data[0]
    f_location = data[1]
    f_database = JSON.parse(JSON.stringify(c_database));
    display_groups();
    document.getElementById('maintheonepiece').className='';
} 
const response_data_save = (data)=>{
    if (data){
        f_database = c_database;
    }
}

const response_data_saveas = (data)=>{
    if (data[0])
        f_location = data[1]
}
const response_data_changekeys = (data)=>{
    if (data[0])
        c_database = data[1];
}

const response_data_new = (data) => {
    console.log(data)
    if (data[0]){
        c_database = data[1];
        f_database = JSON.parse(JSON.stringify(data[1]));
        f_location = data[2];
    }
}
const response_merge = (data) => {
    document.getElementById('maintheonepiece').className='';
    if (data[0]){
        console.log(data)
        c_database = data[1];
        display_entries();
        display_groups();
    }
}
const response_import = (data) =>{
    console.log(data)
    if (data[0]){
        c_database = data[1];
        display_entries();
        display_groups();
    }
}
const response_export = (data) =>{
    console.log(data)
}
const responses_function = [
    response_data_load,//0
    response_data_save,//1
    response_data_saveas,//2
    response_data_changekeys,//3
    response_data_new,//4
    response_merge,//5
    response_import,
    response_export
]

ipcRenderer.on('response', (event, args)=>{
    [_id, _args] = [args.id, args.args];
    responses_function[_id](_args)
})

document.onkeydown = (event) => {
    if (!keyboard_occupied){
        
        if (event.keyCode == 83 && event.ctrlKey && event.shiftKey){
            event.preventDefault();
            if (c_database)
                save_database_as();
        }

        else if (event.keyCode == 83 && event.ctrlKey){
            event.preventDefault();
            if (c_database) save_database();
        }
        if (event.keyCode == 69 && event.ctrlKey && event.shiftKey){
            event.preventDefault();
            if (c_database)
                edit_database();
        }

        else if (event.keyCode == 69 && event.ctrlKey){
            event.preventDefault();
            if (c_database) selected_element.type == 'g' ? edit_group() : edit_entry() ;
        }
        if (event.keyCode == 79 && event.ctrlKey){
            event.preventDefault();
            open_database();
        }
        if (event.keyCode == 68 && event.ctrlKey){
            event.preventDefault();
            if (c_database)
            selected_element.type == 'g' ? clone_group() : clone_entry() ;
        }
        if (event.keyCode == 46){
            event.preventDefault();
            if (c_database)
            selected_element.type == 'g' ? delete_group() : delete_entry();
        }
        if (event.keyCode == 90 && event.ctrlKey && event.shiftKey){
            event.preventDefault();
            if (c_database) {
                c_database = JSON.parse(JSON.stringify(f_database));
                display_groups();
                display_entries();
            }
        }
    }
}