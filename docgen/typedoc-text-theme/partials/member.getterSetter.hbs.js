var member.getterSetter = Handlebars.template({"1":function(depth0,helpers,partials,data,depths) {
  var stack1, buffer = "";
  stack1 = helpers['with'].call(depth0, (depth0 != null ? depth0.getSignature : depth0), {"name":"with","hash":{},"fn":this.program(2, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"2":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, buffer = "            <li class=\"tsd-signature tsd-kind-icon\">";
  stack1 = ((helper = (helper = helpers.compact || (depth0 != null ? depth0.compact : depth0)) != null ? helper : helperMissing),(options={"name":"compact","hash":{},"fn":this.program(3, data, depths),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.compact) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</li>\r\n";
},"3":function(depth0,helpers,partials,data,depths) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, buffer = "\r\n                <span class=\"tsd-signature-symbol\">get</span>&nbsp;\r\n                "
    + escapeExpression(lambda((depths[2] != null ? depths[2].name : depths[2]), depth0))
    + "\r\n";
  stack1 = this.invokePartial(partials['member.signature.title'], '                ', 'member.signature.title', depth0, {
    'hideName': (true)
  }, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer + "            ";
},"5":function(depth0,helpers,partials,data,depths) {
  var stack1, buffer = "";
  stack1 = helpers['with'].call(depth0, (depth0 != null ? depth0.setSignature : depth0), {"name":"with","hash":{},"fn":this.program(6, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"6":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, options, functionType="function", helperMissing=helpers.helperMissing, blockHelperMissing=helpers.blockHelperMissing, buffer = "            <li class=\"tsd-signature tsd-kind-icon\">";
  stack1 = ((helper = (helper = helpers.compact || (depth0 != null ? depth0.compact : depth0)) != null ? helper : helperMissing),(options={"name":"compact","hash":{},"fn":this.program(7, data, depths),"inverse":this.noop,"data":data}),(typeof helper === functionType ? helper.call(depth0, options) : helper));
  if (!helpers.compact) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</li>\r\n";
},"7":function(depth0,helpers,partials,data,depths) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, buffer = "\r\n                <span class=\"tsd-signature-symbol\">set</span>&nbsp;\r\n                "
    + escapeExpression(lambda((depths[2] != null ? depths[2].name : depths[2]), depth0))
    + "\r\n";
  stack1 = this.invokePartial(partials['member.signature.title'], '                ', 'member.signature.title', depth0, {
    'hideName': (true)
  }, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer + "            ";
},"9":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['with'].call(depth0, (depth0 != null ? depth0.getSignature : depth0), {"name":"with","hash":{},"fn":this.program(10, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"10":function(depth0,helpers,partials,data) {
  var stack1, buffer = "            <li class=\"tsd-description\">\r\n";
  stack1 = this.invokePartial(partials['member.signature.body'], '                ', 'member.signature.body', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer + "            </li>\r\n";
},"12":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['with'].call(depth0, (depth0 != null ? depth0.setSignature : depth0), {"name":"with","hash":{},"fn":this.program(10, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<ul class=\"bbb tsd-signatures "
    + escapeExpression(((helper = (helper = helpers.cssClasses || (depth0 != null ? depth0.cssClasses : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"cssClasses","hash":{},"data":data}) : helper)))
    + "\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.getSignature : depth0), {"name":"if","hash":{},"fn":this.program(1, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.setSignature : depth0), {"name":"if","hash":{},"fn":this.program(5, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "</ul>\r\n\r\n<ul class=\"tsd-descriptions\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.getSignature : depth0), {"name":"if","hash":{},"fn":this.program(9, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.setSignature : depth0), {"name":"if","hash":{},"fn":this.program(12, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</ul>";
},"usePartial":true,"useData":true,"useDepths":true});