/*!
 * Vongole UI - JavaScript Demo App using Vongole
 * 
 * Using:
 *   - vongole: https://github.com/ohgyun/vongole/
 *   - Handlebars: http://handlebarsjs.com/
 *
 * Copyright 2012 Ohgyun Ahn
 * MIT Licensed
 * https://github.com/ohgyun/vongole.ui/
 */
(function (g) {

  var vui = g.vongoleUI = {
    VERSION: '0.1'
  };

  var isLive = false; // 시작 전인지 여부 

  // register handlerbar helper
  Handlebars.registerHelper('iter', function (items, options) {
    var ret = '';
    
    _.each(items, function (item, i) {
      ret = ret + options.fn(_.extend({ idx: i}, item));
    });

    return ret;
  });


  // compile templates
  //----------------------------

  // prefix 't' means 'template'
  var tContainer = Handlebars.compile($('#v-tmpl-container').html());
  var tList = Handlebars.compile($('#v-tmpl-list').html());


  // register vongole handlers
  //--------------------------

  vongole.on('run', function (step) {
    setItemTitle(step.title, '');

    $('#v-list').html(tList({
      step: step,
      status: getStatus()
    }));
  });

  vongole.on('runItem', function (item) {
    setItemTitle(item.title, item.description || '');
    printCode(item);
  });

  function setItemTitle(title, description) {
    $('#v-item-title').text(title);
    $('#v-item-description').text(description);
  }

  function printCode(item) {
    $('#console .mustard-content').empty();

    if (item.code) {
      m.printFunctionBody(item.code);
    }

    if (item.result) {
      m.result(item.result);
    }
  }


  // bind dom events
  //----------------

  $('#v-wrap')
      .on('click', '[data-vui=prev]', function (e) {
        prevStep();
      })
      .on('click', '[data-vui=next]', function (e) {
        nextStep();
      })
      .on('click', '[data-vui=debug]', function (e) {
        vongole.debug = e.target.checked;
      })
      .on('click', '[data-vui=item]', function (e) {
        var idx = Number($(this).data('item-idx'));
        runItem(idx);
      });


  // initialize
  //-----------
  
  $('#v-wrap').html(tContainer({
    title: vongole.title
  }));


}(this));
