$(function () {
  $('button#amz-compile').on('click', function () {
    GenerateConfig();
    var modalIns = $('#loading-modal');
    $('div#message').html('Initializing');
    modalIns.modal();


    var msg = {type: 'init'};
    setTimeout(function () {
      $('form#config-form').serializeArray().forEach(function (obj) {
        if (obj.name === 'config') {
          msg.config = obj.value;
        }
      });
      console.log(msg);
      function configSuccess(info) {
        console.log('Done Config', info);
        var reqestID = info.reqID;
        var secret = info.secret;
        var done = false;

        setTimeout(check, 1000);
        function checkSuccess(status) {
          if (status === 'Done') {
            modalIns.modal('close');
            fetchFile();
          } else if (status === 'Compiling') {
            setTimeout(check, 1000);
          } else if (status.indexOf('Waiting') != -1) {
            setTimeout(check, 1000);
          } else if (status === 'Canceled' || status === 'Invalid') {
            modalIns.modal('close');
          }
          $('div#message').html(status);
          console.log('Status: ', status)
        }

        function check() {
          var msg = {type: 'check', reqID: reqestID, secret: secret}
          $.ajax({
            url: '/check',
            data: msg,
            type: 'POST',
            success: checkSuccess,
            error: ErrorCB
          });
        }

        function fetchFile() {
          var form = $('<form><form/>').attr({id: 'getFile', method: 'post', action: '/fetch'});
          var type = $('<input/>').attr({name: 'type', value: 'fetch'});
          var id = $('<input/>').attr({name: 'reqID', value: reqestID});
          var secretBox = $('<input/>').attr({name: 'secret', value: secret});
          form.append(type).append(id).append(secretBox);
          form.hide();
          $('#amz-main').append(form);
          form.submit();
          console.log('Fetching');
        }
      }

      function ErrorCB(error) {
        console.eror(error);
        modalIns.modal('close');
      }

      $.ajax({
        url: '/',
        data: msg,
        type: 'POST',
        success: configSuccess,
        error: ErrorCB
      });
    }, 100)
  });
  $('button#amz-config').on('click', function () {
    GenerateConfig();
    $('form#config-form').submit();
  });

  var $main = $('#amz-main');
  var $theme = $('.cst-widget-themes');
  var $configField = $('#cst-config');
  var $buttons = $('#amz-buttons');
  $(':checkbox[readonly]').on('click', function (e) {
    e.preventDefault();
    return false;
  });

  $('.cst-widget-item').each(function () {
    var $widget = $(this).find('.cst-widget');
    var $themes = $(this).find('.cst-widget-themes');

    $widget.on('click', function () {
      $theme.not($themes).removeClass('am-active');

      if ($(this).is(':checked')) {
        $themes.addClass('am-active am-animation-fade')
      } else {
        $themes.removeClass('am-active');
        $themes.find('input').prop('checked', false);
      }
    });

  });

  $main.on('click', '.amz-cst-checkbox', function () {
    var $parent = $(this).parents('.am-checkbox');
    var $dataStyle = $parent.data('depstyle');
    var $dataJs = $parent.data('depjs');
    var arrStyle = $dataStyle && $dataStyle.split(',') || [];
    var arrJs = $dataJs && $dataJs.split(',') || [];
    var $this = $(this);
    var $val = $this.val();

    if ($this.is(':checked')) {
      fnSelected(arrStyle, $val);
      fnSelected(arrJs, $val);
    } else {
      fnCancel(arrStyle, $val);
      fnCancel(arrJs, $val);
    }

  });

  function GenerateConfig() {
    // e.preventDefault();
    var source = {
      style: [],
      js: [],
      widgets: []
    };
    var $form = $('form#config-form');
    var $arrSerialize = $form.serialize().split('&');
    var $parent = $form.find(':checked').parents('.amz-dep');
    var reg = /cst-(.+)=(.+)/g;

    // data-dep
    $parent.each(function () {
      var $this = $(this);
      var $dataStyle = $this.data('depstyle');
      var $dataJs = $this.data('depjs');
      var arrStyle = $dataStyle && $dataStyle.split(',') || [];
      var arrJs = $dataJs && $dataJs.split(',') || [];

      for (var i = 0; i < arrStyle.length; i++) {
        source.style.push(arrStyle[i]);
      }

      for (var j = 0; j < arrJs.length; j++) {
        source.js.push(arrJs[j]);
      }
    });

    // serialize input
    for (var k = 0; k < $arrSerialize.length; k++) {
      $arrSerialize[k].replace(reg, function ($0, $1, $2) {
        if ($1 == 'style') {
          source.style.push($2);
        } else if ($1 == 'js') {
          source.js.push($2);
        } else if ($1 == 'widget') {
          source.widgets.push({
            "name": $2,
            "theme": []
          })
        } else if ($1 == 'widget-theme') {
          for (var m = 0; m < source.widgets.length; m++) {
            var reg = /([^\.]+)\..+/g;
            $2.replace(reg, function ($0, $1) {
              if ($1 == source.widgets[m].name) {
                source.widgets[m].theme.push($0)
              }
            });
          }
        }
      });
    }

    source.js = fnUnique(source.js);
    source.style = fnUnique(source.style);
    $configField.val(JSON.stringify(source));
  }

  function fnUnique(array) {
    if (!array) return array;
    var obj = {}, a = [];
    for (var i = 0; i < array.length; i++) {
      if (!obj[array[i]]) {
        a.push(array[i]);
        obj[array[i]] = true;
      }
    }
    return a;
  }

  function fnSelected(arr, objValue) {
    $.each(arr, function (index, val) {
      var $selCheckbox = $('input[value="' + val + '"]');

      $selCheckbox
        .prop('checked', true)
        .data(objValue, true);
    })
  }

  function fnCancel(arr, objValue) {
    $.each(arr, function (index, val) {
      var $selCheckbox = $('input[value="' + val + '"]');

      $selCheckbox
        .prop('checked', false)
        .removeData(objValue);

      if (!$.isEmptyObject($selCheckbox.data())) {
        $selCheckbox
          .prop('checked', true)
      }
    })
  }

  function saveData(data, fileName) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";

    var json = JSON.stringify(data),
      blob = new Blob([json], {type: "octet/stream"}),
      url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }
});



