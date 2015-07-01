var member.signatures = Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = "        <li class=\"tsd-description\">\r\n";
  stack1 = this.invokePartial(partials['member.signature.body'], '            ', 'member.signature.body', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer + "        </li>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\r\n<ul class=\"tsd-descriptions\">\r\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.signatures : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</ul>";
},"usePartial":true,"useData":true});