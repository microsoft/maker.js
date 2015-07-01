var index = Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = "<section class=\"xtsd-panel-group tsd-index-group\">\r\n    <section class=\"tsd-panel tsd-index-panel\">\r\n        <div class=\"tsd-index-content\">\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.groups : depth0), {"name":"each","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "        </div>\r\n    </section>\r\n</section>\r\n";
},"2":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "                <section class=\"tsd-index-section "
    + escapeExpression(((helper = (helper = helpers.cssClasses || (depth0 != null ? depth0.cssClasses : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cssClasses","hash":{},"data":data}) : helper)))
    + "\">\r\n                    <ul class=\"tsd-index-list\">\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.children : depth0), {"name":"each","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "                    </ul>\r\n                </section>\r\n";
},"3":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "                        <li class=\""
    + escapeExpression(((helper = (helper = helpers.cssClasses || (depth0 != null ? depth0.cssClasses : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cssClasses","hash":{},"data":data}) : helper)))
    + "\"><a href=\""
    + escapeExpression(((helpers.relativeURL || (depth0 && depth0.relativeURL) || helperMissing).call(depth0, (depth0 != null ? depth0.url : depth0), {"name":"relativeURL","hash":{},"data":data})))
    + "\" class=\"tsd-kind-icon\">";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.name : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.program(6, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</a></li>\r\n";
},"4":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing;
  stack1 = ((helpers.wbr || (depth0 && depth0.wbr) || helperMissing).call(depth0, (depth0 != null ? depth0.name : depth0), {"name":"wbr","hash":{},"data":data}));
  if (stack1 != null) { return stack1; }
  else { return ''; }
  },"6":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "<em>";
  stack1 = ((helpers.wbr || (depth0 && depth0.wbr) || helperMissing).call(depth0, (depth0 != null ? depth0.kindString : depth0), {"name":"wbr","hash":{},"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</em>";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.groups : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { return stack1; }
  else { return ''; }
  },"useData":true});