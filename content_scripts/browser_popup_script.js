
"use strict";

console.log('loading - browser popup content script');




/**
 * Focus on tabs by 
 * @param {tasks or hashtag} type 
 * @param {value} value 
 */
function focusOnTabsByValueRequest(type,value) {
    let message = {command: 'Focuse on Tabs By',type:type,value:value}
    return browser.runtime.sendMessage(message)

}
/**
 * change the status if alert duplicates option
 * @param {boolean} val 
 */
function updateAlertDupStatus(val) {
    let message = {command:'Change is Alert Duplicated Tabs','new_value':val}
    return browser.runtime.sendMessage(message)

}
/**
 * Get the broser state : tasks,hastags,is recording etc..
 */
function getBrowserPopupStateFromBackground(){
        let message = {command: 'BROWSER POPUP STATE'}
        return browser.runtime.sendMessage(message)
}


/**
 * 
 * Notify the background on a user the action made on the record button
 */
function changeRecorderStateRequest(recorderState,taskName){


        let rq= {command: 'Notify Recorder',recorder_state:recorderState,task_name:taskName}

        return browser.runtime.sendMessage(rq)
}

    
/**
 * Ask to open urls of task 
 */
function openUrlsByTaskRequest() {
    let value = document.getElementById('open_task_select').value
     
    openUrlByRequest('tasks',value)
}    
/**
 * Ask to open urls of hashtag 
 */
function openByHashtagRequest() {
    let value = document.getElementById('open_hashtags_select').value
    openUrlByRequest('hashtag',value)

    
}

/**
 * Open urls by 
 */
function openUrlByRequest(type,value) {
    let message = {command:'OPEN URL BY',type:type,value:value}
    browser.runtime.sendMessage(message)
    .then(val => { console.log('return value of - open_url_by:',val);  })
  
}
/**
 * go to the currently playing tab and focus on it 
 */
function gotoPlaying() {
    
    let message = {command:'Switch to playing tab'}
     browser.runtime.sendMessage(message)
     .then(val => { console.log('switched to playing:',val) })
     .catch(err=> {console.log('Error in going to playing tab:',err);})
    
     
}
