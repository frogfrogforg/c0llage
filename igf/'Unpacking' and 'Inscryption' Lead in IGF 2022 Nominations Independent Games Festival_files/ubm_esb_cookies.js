/**
 * @file
 */

(function ($) {

  var cookieName = "cookie-accepted";
  var messageText1 = Drupal.t("This site uses cookies to provide you with the best user experience possible.");
  var messageText3 = Drupal.t("use of cookies.");
  var closebuttonText = 'X';
  var siteName = document.querySelector("meta[property='og:site_name']").getAttribute('content');
  
  Drupal.behaviors.ubm_esb_cookies = {
    attach: function (context, settings) {
      if (Drupal.ubm_esb_cookies.getCookie(cookieName) == '') {
        Drupal.ubm_esb_cookies.createPopup();
      }
    }
  }
  
  Drupal.ubm_esb_cookies = {};

  Drupal.ubm_esb_cookies.setCookie = function () {

    var date = new Date();
    date.setTime(date.getTime() + (100 * 24 * 60 * 60 * 1000)); // 100 days.

    var cookie = "cookie-accepted=true;expires=" + date.toUTCString() + "; path=/";
    document.cookie = cookie;
  }
  
  /**
    * Verbatim copy of Drupal.comment.getCookie().
    */
  Drupal.ubm_esb_cookies.getCookie = function (name) {
    var search = name + '=';
    var returnValue = '';

    if (document.cookie.length > 0) {
      offset = document.cookie.indexOf(search);
      if (offset != -1) {
        offset += search.length;
        var end = document.cookie.indexOf(';', offset);
        if (end == -1) {
          end = document.cookie.length;
        }
        returnValue = decodeURIComponent(document.cookie.substring(offset, end).replace(/\+/g, '%20'));
      }
    }
    return returnValue;
  };

  Drupal.ubm_esb_cookies.createPopup = function () {
    var panel = $('<div id="#ubm-esb-cookies-popup">').addClass('cookies-popup');
    var container = $('<div>').addClass('container').appendTo(panel);
    var tag_row = $('<div>').addClass('row').appendTo(container);
    var tag_div1 = $('<div>').addClass('col-sm-11').appendTo(tag_row);
    var message1 = $('<p>').addClass('cookies-popup__message').html(messageText1).appendTo(tag_div1);
    var tag_div2 = $('<div>').addClass('col-sm-1').appendTo(tag_row);
    var closeButton = $('<span class="close-button">').text(closebuttonText).appendTo(tag_div2).on('click', function () {
      Drupal.ubm_esb_cookies.setCookie();
      Drupal.ubm_esb_cookies.killPopup(panel);
    });
    var message2 = $('<p>').addClass('cookies-popup__message2').html('By using ' + siteName + ', ' + 'you accept our ').appendTo(message1);
    var message3 = $('<a href="https://tech.informa.com/cookie-policy">').addClass('cookieLinkText').html(messageText3).appendTo(message2);
    var controls = $('<div>').addClass('cookies-popup__cookie-controls').appendTo(container);
    $(panel).appendTo('body').animate({ bottom: 0 }, 500);
  }

  Drupal.ubm_esb_cookies.killPopup = function (p) {
    $(p).animate({ bottom: $(p).outerHeight() * -1 }, function () {
      $(this).remove()
    });
  }

}(jQuery));