console.log('data manager');

currentFocusedTabsTask = ''
currentFocusedHashtag = ''
currentTask = ''

var HASHTAGS = {}
var TASKS ={}
var URLS = {}


var isAlertDup = false 

var isRecording = false 
//  clearAll()
 function initRecording(taskName) {
  return new Promise((resolve,reject)=> {
  //if taskname exists - return error
  console.log('TASKS[task_name]:',TASKS[taskName],! (TASKS[taskName]  ===  undefined));
  
  if (! (TASKS[taskName]  ===  undefined)) { 
    //return error 
    return reject(false)  
  }
  // add task to TASKS 
  TASKS[taskName] = []
  //set current task
  console.log('set is recording:');
  
  currentTask = taskName
  //set is recording 
  console.log('set is recording:',true);

  isRecording = true 
  resolve(true)
  })

}
 function endRecording() { 
  return new Promise((resolve,reject)=> {
    if (!isRecording) { return resolve( false) }
    console.log('currentTask:',currentTask,'TASKS[currentTask]:',TASKS[currentTask]);
 
    saveTaskToDisk(currentTask,TASKS[currentTask])
    .then(val=> {
        console.log('save_task_to_disk ',val);
        isRecording = false
        currentTask = ''
        resolve(true)
      })
      .catch((err)=> { console.log(err);resolve(false) })      

  }
  )   



}




function getCurrentPopupState() {


  let res = {is_alert_dup:isAlertDup,is_recording: getIsRecording() ,tasks:getTasksListFromStorage() ,hashtags: getHashtagListFromStorage(),current_task:currentTask}
  console.log('res:',res);
  return res  

}
// function GetDefaultPopupInformation() {
//   res['is_recording'] = GetIsRecording() 
//   res['is_alert_dup'] = isAlertDup
//   res['hashtags'] =hashtags
//   res['tasks'] = tasks
//   res['current_task'] = current_task
//     return {is_alert_dup:isAlertDup,is_recording:isRecording,tasks:tasks ,hashtags:hashtags,current_task:current_task}
// }

function updateCurrentTask(newName) {
  currentTask = newName
}
function getHashtagByUrl(url) {
    
    return (URLS.hasOwnProperty(url)) ?  URLS[url] : null
       

}

function setHashtagByUrl(url,hashtag) {  
  //get previous hashtag if exists 
  let oldHashtag = URLS[url] 

  //remove it 
  if ( ! (oldHashtag === undefined)) {

    HASHTAGS[oldHashtag] = HASHTAGS[oldHashtag].filter(item => item !== url)
    
    if (HASHTAGS[oldHashtag].length == 0) { 
    //  HASHTAGS.remove(old_hashtag)
     delete HASHTAGS[oldHashtag];
    
    }
  }

  //set new url 
  URLS[url] = hashtag

  //set new hashtag
  if (HASHTAGS[hashtag]  ===  undefined ) {   HASHTAGS[hashtag] = [] }
  HASHTAGS[hashtag].push(url)

  //save in db
  //this also removes previous values from the db 
  addUrlHashtagInDB(url,hashtag)

    return 
}

function getUrlsByHashtag(hashtag) {
    return HASHTAGS[hashtag]
}

function getUrlsByTask(task){
  return TASKS[task]
}


function getTasksListFromStorage() {
  console.log('get_task_list_from_storage', Object.keys(TASKS));

    return  Object.keys(TASKS)
}

function getHashtagListFromStorage() {
    console.log('get_hashtag_list_from_storage',Object.keys(HASHTAGS));
    
    return  Object.keys(HASHTAGS)
}

function getIsAlertDupFromStorage() {
    return  isAlertDup
}


function onError(){
    console.log('err');
    return false 
    
}


function storeNote(title, body) {
  console.log('storeNote:','Title:',title,'Body:',body);
  return browser.storage.local.set({ [ title] : body })

    
  
   
    
  }
  

//U 
function dataInitialize() {
  console.log('data manager - initialize');
  var gettingAllStorageItems = browser.storage.local.get(null);
  gettingAllStorageItems.then((results) => {
    var noteKeys = Object.keys(results);
    for (let noteKey of noteKeys) {
   

      let type = results[noteKey].type
      let value = results[noteKey].value
      console.log('ADDING TO TABLES FROM DB\n','type:',type,'value:',value,'key:',noteKey);
      
      addValueToTables(type,noteKey,value)
     
    
     
    }
  }, onError);



}

/* function to update notes */
/** Based on firefox tutorial*/
function updateNote(delNote,newTitle,newBody) {
    var storingNote = browser.storage.local.set({ [newTitle] : newBody });
    storingNote.then(() => {
      if(delNote !== newTitle) {
        var removingNote = browser.storage.local.remove(delNote);
        removingNote.then(() => {
          displayNote(newTitle, newBody);
        }, onError);
      } else {
        displayNote(newTitle, newBody);
      }
    }, onError);
  }



function clearAll() {
    return browser.storage.local.clear();
  }
function deleteTables() {
  
  URLS = {}
  TASKS= {}
  HASHTAGS= {}
  isAlertDup = false 
  isRecording = false 
  currentTask = '' 
}


  //remove url from old hashtag 
  //asign new hashtag to url
function addUrlHashtagInDB(url,hashtag) {

  
  let key = {url:url}
  let val = {value:hashtag,type:'hashtag'}
  new Promise((resolve,reject)=> {
    
    var removingNote = browser.storage.local.remove(url);
    removingNote.then(()=>{console.log('removed:key:',url); resolve({key:url,val:val})},err=> { console.log('storage error',err); resolve({key:url,val:val})})

  }).then(data=> {
    console.log('added:key:',data);

    storeNote(data.key,data.val)
      .then((val)=> {console.log('storeNote',data.key,data.val);
      })
      .catch((err)=> {console.log('Error in\n Function:','add_url_hashtag_in_db\n','Details:',err);
       })
    })


}


function onError(err) {
  console.log('storage error',err);
  
}

function getDBValueByCriteria() {
  
  var gettingAllStorageItems = browser.storage.local.get(null);
  gettingAllStorageItems.then((results) => {
    var noteKeys = Object.keys(results);
    let res = [] 

    for (let noteKey of noteKeys) {

      var curValue = results[noteKey];
      URLS[noteKey] = curValue
      if (HASHTAGS[curValue] === undefined) {
        HASHTAGS[curValue] = []
      }
      HASHTAGS[curValue].push(noteKey)
    
     
    }
  }, onError);
}

// ADD PROPER DATA TO HASHTABLE
function addValueToTables(type,key,value) {
  let table;
  switch(type) {
    case 'hashtag':
      URLS[key] = value
      console.log('add_value_to_tables',HASHTAGS);
      
      if (HASHTAGS[value] === undefined) {  HASHTAGS[value] = []  }
      HASHTAGS[value].push(key)
      break;
    case 'task':
      TASKS[key] = value
      break;
    case 'popup':
      isAlertDup = value 
      console.log('isAlertDup',isAlertDup,value); 
       break;
  } 



}

function storeAlertDupInDb(val) {
  return new Promise((resolve,reject) => {
    console.log('isAlertDup', 'value:',val);
    
    storeNote('isAlertDup', {value:val,type:'popup'})
    .then(() =>{ resolve( true)})
    .catch((err)=> {console.log('Error in\n Function:','add_url_hashtag_in_db\n','Details:',err);
      reject(false);})
  })
  

  

}
function getIsRecording() {
  return isRecording
}


function updateDupTabListener(bool) {
  isAlertDup = bool
  return storeAlertDupInDb(isAlertDup)
}

function updateIsRecording(bool) {
  isRecording  = bool

}
function setCurrentTaskName(task_name) { 
  currentTask = task_name

}

function getCurrentTaskName() { 
  return currentTask
}

function addToCurrentTask(url) { 
  if (currentTask === undefined) { return}
  if (TASKS[currentTask]  ===  undefined){
    TASKS[currentTask]  = [] 
  }
  TASKS[currentTask].push(url)
}




function saveTaskToDisk(taskName,urls) { 
  return     storeNote(taskName, {value:urls,type:'task'})
    

}



