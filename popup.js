/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */
function getCurrentTabUrl(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    active: true,
    currentWindow: true
  };

  chrome.tabs.query(queryInfo, function(tabs) {
    // chrome.tabs.query invokes the callback with a list of tabs that match the
    // query. When the popup is opened, there is certainly a window and at least
    // one tab, so we can safely assume that |tabs| is a non-empty array.
    // A window can only have one active tab at a time, so the array consists of
    // exactly one tab.
    var tab = tabs[0];

    // A tab is a plain object that provides information about the tab.
    // See https://developer.chrome.com/extensions/tabs#type-Tab
    var url = tab.url;

    // tab.url is only available if the "activeTab" permission is declared.
    // If you want to see the URL of other tabs (e.g. after removing active:true
    // from |queryInfo|), then the "tabs" permission is required to see their
    // "url" properties.
    console.assert(typeof url == 'string', 'tab.url should be a string');

    callback(url);
  });

  // Most methods of the Chrome extension APIs are asynchronous. This means that
  // you CANNOT do something like this:
  //
  // var url;
  // chrome.tabs.query(queryInfo, function(tabs) {
  //   url = tabs[0].url;
  // });
  // alert(url); // Shows "undefined", because chrome.tabs.query is async.
}

/**
 * @param {string} searchTerm - Search term for Google Image search.
 * @param {function(string,number,number)} callback - Called when an image has
 *   been found. The callback gets the URL, width and height of the image.
 * @param {function(string)} errorCallback - Called when the image is not found.
 *   The callback gets a string that describes the failure reason.
 */
function getPageHtml(url, callback, errorCallback) {
  var x = new XMLHttpRequest();
  x.open('GET', url);
  // The Google image search API responds with JSON, so let Chrome parse it.
  x.responseType = 'text';
  x.onreadystatechange = function() {
    if (x.readyState === XMLHttpRequest.DONE) {
      callback(x.responseText);
    }
  };
  x.onerror = function() {
    errorCallback('Network error.');
  };
  x.send();
}

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

chrome.webRequest.onBeforeSendHeaders.addListener(function(details){
  var headers = details.requestHeaders,
  blockingResponse = {};

  // Each header parameter is stored in an array. Since Chrome
  // makes no guarantee about the contents/order of this array,
  // you'll have to iterate through it to find for the
  // 'User-Agent' element
  for( var i = 0, l = headers.length; i < l; ++i ) {
    if( headers[i].name == 'User-Agent' ) {
      headers[i].value = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36';
      break;
    }
  }

  blockingResponse.requestHeaders = headers;
  return blockingResponse;
},
{urls: [ "<all_urls>" ]},['requestHeaders','blocking']);

document.addEventListener('DOMContentLoaded', function() {
  getCurrentTabUrl(function(url) {
    renderStatus('Try to read news from ' + url);

    getPageHtml(url, function(html) {
      //renderStatus('News url: ' + url + '\n' + 'result: ' + html);
      document.write(html);
      document.close();
      //body.innerHTML = html;

    }, function(errorMessage) {
      renderStatus('Cannot display news html. ' + errorMessage);
    });
  });
});
