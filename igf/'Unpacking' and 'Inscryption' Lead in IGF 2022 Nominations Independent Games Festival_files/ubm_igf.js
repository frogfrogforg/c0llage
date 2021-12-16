(function ($) {

  Drupal.behaviors.toggleParagraphs = {
    attach: function (context, settings) {
      // Toggle the plus/minus icon for the paragraph toggle
      $('.paragraph-item-row  div#accordion').on('show.bs.collapse', function (e) {
        // Toggle the icon of current item selected from plus to minus
        $(e.target).prevAll().find('.glyphicon').toggleClass('glyphicon-plus glyphicon-minus');
      });

      // Make sure that if none are expanded, then most recently closed item has the plus sign
      $('.paragraph-item-row  div#accordion').on('hide.bs.collapse', function (e) {
        $(e.target).prevAll().find('.glyphicon').toggleClass('glyphicon-plus glyphicon-minus');
      }); 
    }
  };

  Drupal.ubm_igf = Drupal.ubm_igf || {};
  
  // Added for CES-31 by Ruchita 
  Drupal.behaviors.ubm_base_bulletListConfig = {
    attach: function (context, settings) {
      $(document).ready(function () {
        $(".list-left").wrap("<div class='flexlist-left'></div>");
        $(".list-center").wrap("<div class='flexlist-center'></div>");
        $(".list-right").wrap("<div class='flexlist-right'></div>");
      });
    }
  }

  // Determine which of bootstrap's environment we are in, using Bootstrap's CSS classes.
  // Obtained from http://stackoverflow.com/questions/14441456/how-to-detect-which-device-view-youre-on-using-twitter-bootstrap-api
  Drupal.ubm_igf.findBootstrapEnvironment = function() {
    var envs = ['xs', 'sm', 'md', 'lg'];

    $el = $('<div>');
    $el.appendTo($('body'));

    for (var i = 0; i < envs.length; i++) {
      var env = envs[i];

      $el.addClass('hidden-' + env);
      if ($el.is(':hidden')) {
        $el.remove();
        return env
      }
    };
  };

  // Js For tech footer  
  Drupal.behaviors.ubm_igf_techfooterbgcolor = {
    attach: function (context, settings) {
      $(window).load(function(){
        if($('.tech-footer').length != 0) {
          $('.footer-tech').css({'background': '#454955'});
        }
      });
      $(window).resize(function(){
        if($(window).width() < 896) {
          if($('.tech-footer').length != 0) {
            $('.footer-content').css({'width': '100%'});
          }	else if($(window).width() > 992) {
            $('.footer-content').css({'width': '92%'});
          }
        }
      });
    }
  }

  // Vertically align buttons within a paragraph, ignoring those with a picture below.
  Drupal.behaviors.adjustParagraphButtons = {
    attach: function (context, settings) {
      $(window).on('load resize', function(event) {
        if (Drupal.ubm_igf.findBootstrapEnvironment() != 'xs') {
          // For each paragraph in the page.
          $('.entity-paragraphs-item').each(function() {
            // Find all buttons which aren't above a picture.
            var buttons = $(this).find('[class*="field-name-field-paragraph-button"] > div > div > a:not(.above-picture)');
            // Done if not at least two such buttons.
            if (buttons.length > 1) {
              // Among resulting buttons, find the max top offset, after removing any
              // previously set margin-top, to not pollute result when resizing.
              var max_offset_top = 0;
              buttons.css('margin-top', '').each(function() {
                max_offset_top = Math.max(max_offset_top, $(this).offset().top);
              });
              // Use an amount of margin-top equal to the difference with that maximum to vertically align the buttons.
              buttons.each(function(){
                if ($(this).offset().top < max_offset_top) {
                  $(this).css('margin-top', max_offset_top - $(this).offset().top);
                }
              });
            }
          });
        }
      });
    }
  }
  
  Drupal.behaviors.wrapAnchorParagraph = {
    attach: function (context, settings) {
      $('.center-block').parent('a').wrap("<div class='image-wrapper'></div>");
    }
  }

})(jQuery);
