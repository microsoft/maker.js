var default = Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = this.invokePartial(partials.navigation, '                        ', 'navigation', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"3":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = this.invokePartial(partials['toc.root'], '                        ', 'toc.root', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, lambda=this.lambda, escapeExpression=this.escapeExpression, functionType="function", helperMissing=helpers.helperMissing, buffer = "---\r\nlayout: page\r\ntitle: Api - "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.model : depth0)) != null ? stack1.name : stack1), depth0))
    + " "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.model : depth0)) != null ? stack1.kindString : stack1), depth0))
    + "\r\n---\r\n\r\n<div class=\"container container-main toggle-visibilityprivate toggle-public\">\r\n    <div class=\"row\">\r\n        <div class=\"col-8 col-content\">\r\n            ";
  stack1 = ((helper = (helper = helpers.contents || (depth0 != null ? depth0.contents : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"contents","hash":{},"data":data}) : helper));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\r\n        </div>\r\n        <div class=\"col-4 col-menu menu-sticky-wrap menu-highlight\">\r\n            <nav class=\"tsd-navigation primary\">\r\n                <ul>\r\n";
  stack1 = helpers.each.call(depth0, ((stack1 = (depth0 != null ? depth0.navigation : depth0)) != null ? stack1.children : stack1), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "                </ul>\r\n            </nav>\r\n            <nav class=\"tsd-navigation secondary menu-sticky\">\r\n                <ul class=\"before-current\">\r\n";
  stack1 = helpers.each.call(depth0, ((stack1 = (depth0 != null ? depth0.toc : depth0)) != null ? stack1.children : stack1), {"name":"each","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "                </ul>\r\n            </nav>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n";
  stack1 = this.invokePartial(partials.footer, '', 'footer', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"usePartial":true,"useData":true});