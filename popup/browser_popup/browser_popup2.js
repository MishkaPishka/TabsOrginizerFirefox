


function setRecorderLable(label,currentTask) {
  document.getElementById('recorder').innerText = label
  document.getElementById('task_name').innerText = currentTask === undefined || currentTask === '' ?  'Task Name' : currentTask
}
  function changeRecorderState() {

    let recorder_state = document.getElementById('recorder').innerText
    let task_name = document.getElementById('task_name').value
 

    changeRecorderStateRequest(recorder_state,task_name)
      .then(res=>{
              if (recorder_state ==='Record') {
                  document.getElementById('task_name').readOnly = true

      
              }

              else {
                document.getElementById('task_name').readOnly = false

              }
              setRecorderLable(res.recorder_state,res.task_name) 
      })
      .catch((err)=>{
        console.log('change_recorder_state:',err);
        document.getElementById('task_name').value = ''
        document.getElementById('task_name').readOnly = false

        
      })                          

  }

  
    /**
     * 
     * @param {tasks} list 
     */

    function populateTasks(list) {
      
      populateSelect('task_select',list)
      populateSelect('open_task_select',list)

    }
    
       /**
     * 
     * @param {hashtags} list 
     */
    function populateHashtags(list) {
      populateSelect('hashtags_select',list)
      populateSelect('open_hashtags_select',list)

    }

 
    function populateSelect(select_id,options) {
      
      let select = document.getElementById(select_id); 

      for(let i = 0; i <options.length; i++)
      {
        let opt = options[i];
        let el = document.createElement("option");
          el.textContent = opt;
          el.value = opt;
          
          select.appendChild(el);
          }
    }

    /**
     * Send request to get the popup state from background 
     */
  function loadPopupState(){
  
    //send request to get state
    getBrowserPopupStateFromBackground()
      .then(res=>{
          console.log('browserpopup - load browser state:',res)
          let recorder_state = res['is_recording']
          let isAlertDupe = res['is_alert_dup']
          let hashTagsList = res['hashtags']
          let tasksList = res['tasks']
          let currentTask = res['current_task']


          
          console.log('load_popup_state, recorder state',res);

          let recorder_str =recorder_state  ? 'Stop':'Record' // True means recording, False means idle
          populateHashtags(hashTagsList)

          populateTasks(tasksList)


          setTabDupLabel(isAlertDupe)
          setRecorderLable(recorder_str,currentTask) 
          

      })
      
  }

  function removeAll() {
    
    let message = {command:'Remove All'} 
    browser.runtime.sendMessage(message)
    .then(() => { 
      console.log('removed all data:'); 
    loadPopupState()
    
  
  })
    .catch(err=> {console.log('Error in going to deletion loading tab:',err);})
   
}
  function focusTask (){
    console.log('Browser popup - selected focus');
    let value = document.getElementById('task_select').value
    focusOnTabsByValueRequest('task',value)
      .then(val=>console.log('val',val))
      
      


  }
  function focusHashtag() {
    console.log('Browser popup - selected hashtag');
    let value = document.getElementById('hashtags_select').value
    focusOnTabsByValueRequest('hashtag',value)
      .then(val=>console.log('val',val))

  }

  function setTabDupLabel(label) {
    is_notify_dup = document.getElementById('tab_dup1').checked = label

  }

    //TODO
    function setTabDup(){
        is_notify_dup = document.getElementById('tab_dup1').checked
        console.log('bbb',is_notify_dup);
        
        updateAlertDupStatus (is_notify_dup) // notify background and receive confirmation 
          .then(val=> {
            
            if (val ==='true') {
              is_notify_dup = !is_notify_dup
              
              document.getElementById('tab_dup1').checked = is_notify_dup
              
            }
          })
          .catch(err=>{
            console.log('err in setTabDup',err);
            
          })


    }

document.addEventListener("DOMContentLoaded", function(){
   
  
  browser.tabs.executeScript({file: "/content_scripts/browser_popup_script.js"})

  
  console.log('after content  - browser_popup_script')
  
  loadPopupState();


  //ADD LISTENERS FOR POPUP EVENTS
  //Click event on tracker button on popup 
  document.getElementById('recorder').addEventListener("click", changeRecorderState)
  //tab dup
  document.getElementById('tab_dup1').addEventListener("click", setTabDup)

  document.getElementById('remove_all_data').addEventListener("click", removeAll)

  //focus on hashtag

    document.getElementById('hashtags_select').onchange = focusHashtag

    //focus on hashtag
  document.getElementById('task_select').onchange= focusTask

  document.getElementById( 'switch_to_playing').addEventListener("click", gotoPlaying) 


  document.getElementById('open_task_select').onchange = openUrlsByTaskRequest

  document.getElementById('open_hashtags_select').onchange = openByHashtagRequest


  
   


  }) // EVENT ON DOCUMENT LOAD

  


