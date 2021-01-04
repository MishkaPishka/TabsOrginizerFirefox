
let currentURL = ''
//once the popup is opened the value of the currentURL is updated
browser.tabs.query({currentWindow: true, active: true}).then((tabs) => {
  let tab = tabs[0]; // Safe to assume there will only be one result
  console.log(tab.url);
  currentURL = tab
  askForHashtag(tab.url)

}, console.error)
document.getElementById('save_site_hashtag').addEventListener("click", saveLable)


browser.runtime.onMessage.addListener(request => { 
  if (request.command === 'Set Hashtag') {
    console.log('pagepopup - set hashtage, request:',request);
    
    let hashtag = request.hashtag
    document.getElementById('hashtag_input').value = hashtag
    console.log('filled hashtag value',hashtag);
    
  }


})



function readHashtagFromInput() { 
  console.log("document.getElementById('hashtag_input').value",document.getElementById('hashtag_input').value);
  
  return  document.getElementById('hashtag_input').value
}

function askForHashtag(url) {
    let rq= {command: 'Ask hashtag',url:url}
    
    browser.runtime.sendMessage(rq)
  
  }







function saveLable() {
  // or the short variant
  
  var hashtag = document.getElementById('hashtag_input').value
  
  let rq= {command: 'Update Hashtag',hashtag:hashtag,url:currentURL.url}
  browser.runtime.sendMessage(rq)
    .then(res=>{
      
      if (res.ack===true) {
        console.log('update complete');
      }
    })
    .catch(err => {
      console.log    ('error in update',err)
  
    })

}


