var default = Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression;
  return escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.project : depth0)) != null ? stack1.name : stack1), depth0));
  },"3":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression;
  return escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.model : depth0)) != null ? stack1.name : stack1), depth0));
  },"5":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = this.invokePartial(partials.navigation, '                        ', 'navigation', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = this.invokePartial(partials['toc.root'], '                        ', 'toc.root', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, functionType="function", buffer = "﻿---\r\nlayout: page\r\ntitle: MakerJs ";
  stack1 = ((helpers.ifCond || (depth0 && depth0.ifCond) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.model : depth0)) != null ? stack1.name : stack1), "==", ((stack1 = (depth0 != null ? depth0.project : depth0)) != null ? stack1.name : stack1), {"name":"ifCond","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n---\n\n<div class=\"container container-main toggle-visibilityprivate toggle-public\">\n    <div class=\"row\">\n        <div class=\"col-8 col-content\">\n            ";
  stack1 = ((helper = (helper = helpers.contents || (depth0 != null ? depth0.contents : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"contents","hash":{},"data":data}) : helper));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n        </div>\n        <div class=\"col-4 col-menu menu-sticky-wrap menu-highlight\">\n            <nav class=\"tsd-navigation primary\">\n                <ul>\n";
  stack1 = helpers.each.call(depth0, ((stack1 = (depth0 != null ? depth0.navigation : depth0)) != null ? stack1.children : stack1), {"name":"each","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "                </ul>\n            </nav>\n\n            <nav class=\"tsd-navigation secondary menu-sticky\">\n                <ul class=\"before-current\">\n";
  stack1 = helpers.each.call(depth0, ((stack1 = (depth0 != null ? depth0.toc : depth0)) != null ? stack1.children : stack1), {"name":"each","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "                </ul>\n            </nav>\n        </div>\n    </div>\n</div>\n\n";
  stack1 = this.invokePartial(partials.footer, '', 'footer', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"usePartial":true,"useData":true});