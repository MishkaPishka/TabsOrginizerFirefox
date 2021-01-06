





onOpen();

let UrlsToIgnoreInRecording = ['about:blank']
let CloseDupTabParameters = []


 
function onOpen() { 
  //read from DB
  dataInitialize();
  //set event listeners 
  setEventsListeners()


}

function handleClickOnNotification(ntf) {
    let splits = ntf.split('param1:');
  if (Array.isArray(splits) && splits[0] != undefined && CloseDupTabParameters.includes(splits[0])){
    let [IdToRemove,IdToFocus] =  splits[1].split('param2:')
    CloseDupTabParameters = CloseDupTabParameters.filter(s => s !== splits[0]);
    //close tab of id = splits[0]
    browser.tabs.remove(parseInt(IdToRemove))

    console.log('id_to_focus:',IdToFocus);
    
    browser.tabs.update(parseInt(IdToFocus),{active:true})


  }
}


//INITIALIZE AT START




//actions on new url loaded check dup
//isDup display notification 
//if record - adds to recording stack 
function handleUpdated1(tabId, changeInfo, tabInfo) {

  if(getIsRecording()&&  changeInfo.status === 'complete' && tabInfo.status === 'complete'  && !UrlsToIgnoreInRecording.includes(tabInfo.url)    ) {
      console.log('    add_to_current_task(tabInfo.url)    ',tabInfo.url);
      addToCurrentTask(tabInfo.url)
  }
  if (isAlertDup) { 
    getCurrentWindowTabs()
      .then((tabs) => {
        
        for ( let tab of tabs) { 

           if(tabInfo.url === tab.url &&   changeInfo.status === 'complete' && tabInfo.index != tab.index){ //IF a duplicate is found

               let id = Math.random().toString(36).substring(7);
              CloseDupTabParameters.push(id) 
            browser.notifications.create(id+'param1:'+tabId.toString()+'param2:'+tab.id,{
              "type": "basic",
              "iconUrl": browser.extension.getURL("icons/page_open.png"),
              "title":'Duplicated URL:'+tab.url,
              "message": 'Click to unite',
              "isClickable":true,
              'contextMessage':JSON.stringify({url:tabInfo.url,id:tabId}),
            
            });
            return 
       
          }

        }
      })

     }
  
}


function goToPlayingTab() {
  return new Promise((resolve,reject)=> {
    getCurrentWindowTabs()
    .then((tabs) => {
      
      for ( let tab of tabs) { 

          if (tab.audible ===  true) {
            
            browser.tabs.update(tab.id,{active:true})
            resolve(true)

          }
      }
      reject (false)
    })

  })

}


 function setEventsListeners() {
  console.log('background - set_events_listeners');
   browser.notifications.onClicked.addListener(handleClickOnNotification);
   browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
   browser.pageAction.show(tab.id);

  });

  //
  //  Message Listener 
  //
  browser.runtime.onMessage.addListener( (message) => {


    
    return new Promise((resolve,reject) =>{

    
      console.log('Background script received message:',message);
        /**
        *** SWITCH TO PLAYING TAB
        **/
      if ( message.command === 'Switch to playing tab') {
    
        goToPlayingTab()
        .then((val)=> {    resolve (val)})
    
  
        
      }
        /**
        *** GET HASHTAG OF URL 
        **/
      else if (message.command === 'Ask hashtag') {
        
        let url = message.url
        let hashtag = getHashtagByUrl(url)
        
         browser.runtime.sendMessage( {command:'Set Hashtag',hashtag:hashtag,url:url});
         resolve(true) 
      }
      else if (message.command ==='Update Hashtag') {
        let url = message.url
        let hashtag = message.hashtag

        setHashtagByUrl(url,hashtag)
        
        resolve(true)
      }

        /**
        *** FOCUS ON TABS BY TASK\HASHTAG 
        **/
      else if (message.command === 'Focuse on Tabs By') {
        let type = message.type
        let value = message.value
        focusOnTabsByValue(type,value)
          .then(val =>{ 
            if (Array.isArray(val) && val.length != 0) {
              browser.tabs.update(val[0].id,{active:true})

            }
            
          
           resolve(val)})
          .catch(err=> {reject(err)})
        

      }
      /**
      *** SET THE STATUS OF IS DUP NOTIFICATIONS
      **/
      else if (message.command === 'Change is Alert Duplicated Tabs') {
        console.log('background',message)  
        isAlertDup = !isAlertDup //UPDATE POPUP STATE 
        updateDupTabListener(isAlertDup)
          .then(val=>{
            console.log('xxxxxxxxxxxxxxxxxxxx',val);
            
            return resolve(val)})} 
        
      else if (message.command ==='Remove All') {
        clearAll()
        .then(()=>{
          console.log('after clear akk');
          
          deleteTables()
          
          return resolve(true)})
   
      }
      /**
      *** GET THE POPUP CURRENT STATE 
      **/
      else if (message.command === 'BROWSER POPUP STATE') {
        console.log('background - broswer popup state request');
        resolve(getCurrentPopupState())
      }
      else if (message.command === 'OPEN URL BY') {
        let type = message.type
        let value = message.value 
        
    
        openUrlsBy(type,value)
          .then((val)=>{console.log('val:',val);
          })
        return resolve(value)

          
      }
     

        //check recorder current state see it fits
        //if record now - check not overiding existing task
        //if done - > save and update 
      else if (message.command === "Notify Recorder") {

          let IsClickRecord = message.recorder_state === 'Record'
          let IsTaskNameEmpty = message.task_name === '' 
          
          if (IsClickRecord && !IsTaskNameEmpty) {
             initRecording(message.task_name)
              .then((val)=> {
                return resolve({status:val,task_name:'',recorder_state:'Stop'})

              })
              .catch((err)=> { return resolve({status:err,task_name:'',recorder_state:message.recorder_state})})


            //TODO 
            // INITIZATE RECORDING STATE 
          }
          else if(!(IsClickRecord || IsTaskNameEmpty)) {
            
          endRecording()
            .then((val)=> {
              
              return resolve({status:val,task_name:'',recorder_state:'Record'})

            })
            .catch((err)=> { return reject(err)})
        
        
          }
          else { 
            return reject({err:'invalid recorder state or task name'})
          }

      }  //if command 

    })
    .then(val => { return Promise.resolve(val)})
    
    .catch(err => { console.log('Request ERR:',err ); return Promise.resolve(err) }  ) 
    



  })
  // end addListener

  browser.tabs.onUpdated.addListener(handleUpdated1);



}

  
  function openUrlsBy(type,value) {
    return new Promise((resolve,reject)=>{

   
      let func;
      if (type === 'hashtag') {
        func = getUrlsByHashtag
      }
      else {
        func = getUrlsByTask
      }
      let urls = func(value)
      console.log('return value of get urls:',urls);
      
      if (urls === undefined) { resolve(true)}
      for (let url of urls) {
        console.log('url opening:',url);

          let creating = browser.tabs.create({
          url:url,
          index:0
        })
        creating.then((tab)=>{  console.log(`Created new tab: ${tab.id},${tab.url}`)})
        .catch(err => {console.log('err in open_urls_by',err); reject(err)
        })
        
      
     }
      resolve(true)
    })
  }

  function getActiveTab() {
    return browser.tabs.query({active: true, currentWindow: true});
  }

  function getCurrentWindowTabs() {
  return browser.tabs.query({currentWindow: true});
}


//TODO
function focusOnTabsByValue(type,value) {
   return new Promise ((resolve ,reject)=> {
    let TabsToFocusOn = []
    //get list of open tabs by type value
    let refrence ;
    if (type === 'hashtag') {
      refrence = getUrlsByHashtag(value)
    }
    else {
      refrence = getUrlsByTask(value)
    }
    let querying = browser.tabs.query({currentWindow: true})
    querying.then(  (tabs)=> { 
        tabs.forEach(function (item, index) {
        //check if tab has the desired label 
        let bool = refrence !== undefined &&  refrence.includes( item.url)  ? true: false
        if (bool) {
          TabsToFocusOn.push(item.id) 
        }
       })//FOR EACH
       resolve(
           browser.tabs.move(
        TabsToFocusOn,              // integer or integer array
        {index: -1}       // object
      ))
  
       }).catch((err) => {reject(err)})
      })
}
