(function ($) {
    Drupal.ubm_base = Drupal.ubm_base || {};

    var Header = function () { };
    Header.prototype.getHeight = function () {
        return { min: 0, max: 0 };
    };
    Header.prototype.hideMenus = function () { };
    Header.prototype.toDefaultHeight = function () { };
    Header.prototype.resize = function () { };
    Header.prototype.setHeight = function () { };
    window.PentonSingleHeader = new Header();
    function resizeInformaBanner(min, max) {
        min = min || 0;
        max = max || 0;
        PentonSingleHeader.toDefaultHeight();
        var height = PentonSingleHeader.getHeight();
        PentonSingleHeader.resize(height.minHeight + min, height.maxHeight + max, 'none');
    }

    Drupal.behaviors.informaHeader = {
      attach: function (context, settings) {
      $(window).on('load', function(event) {
        var HEIGHT_INFORMA = 35;
        if ($('#iribbon-container').length) {
            var $iribbonContainer = $('#iribbon-container');
            var $iribbonDetail = $('#iribbon-detail');
            var $pillarNav = $('.pillar-nav');
            $pillarNav.addClass('informa-banner');
            $iribbonDetail.find('a').attr('tabindex', -1);
            var $ribbonButton = $iribbonContainer.find('#iribbon-title');
            $ribbonButton.on('click', function () {
                var $legalAlertHeight = $('.js-penton-legal-comm-ajax-output-alert')
                    .height();
                if ($iribbonDetail.hasClass('ribbon-hide')) {
                    // open it
                    $iribbonDetail.removeClass('ribbon-hide')
                        .css({ 'margin-top': '' })
                        .addClass('ribbon-show')
                        .find('a')
                        .attr('tabindex', 0);
                    // if user tabs out of the last of the ribbon links then hide the ribbon
                    $iribbonDetail.find('a').last().keydown(function (e) {
                        // if 'Shift + Tab' pressed = tabbing backwards
                        if (e.shiftKey && e.keyCode == 9) {
                            return;
                        }
                        else {
                            if (e.keyCode == 9) { // if 'Tab' only pressed = tabbing forwards
                                $iribbonDetail.removeClass('ribbon-show')
                                    .css({ 'margin-top': '' })
                                    .addClass('ribbon-hide')
                                    .find('a')
                                    .attr('tabindex', -1);
                                $(this).removeClass('active');
                            }
                        }
                    });
                    // if user shift-tabs back out of the ribbon controls then hide the ribbon
                    $ribbonButton.keydown(function (e) {
                        // if 'Shift + Tab' pressed = tabbing backwards
                        if (e.shiftKey && e.keyCode == 9) {
                            $iribbonDetail.removeClass('ribbon-show')
                                .css({ 'margin-top': '' })
                                .addClass('ribbon-hide')
                                .find('a')
                                .attr('tabindex', -1);
                            $(this).removeClass('active');
                        }
                    });
                    // toggle button image position
                    $(this).addClass('active');
                    resizeInformaBanner(0, $legalAlertHeight + $iribbonContainer.height() - HEIGHT_INFORMA);
                }
                else {
                    // shut it
                    $iribbonDetail.removeClass('ribbon-show')
                        .css({ 'margin-top': '' })
                        .addClass('ribbon-hide')
                        .find('a')
                        .attr('tabindex', -1);
                    // toggle button image position
                    $(this).removeClass('active');
                    resizeInformaBanner(0, $legalAlertHeight);
                }
            });
        }
    })
    }}
}(jQuery));