var member.sources = Handlebars.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = "        <p>Inherited from ";
  stack1 = helpers['with'].call(depth0, (depth0 != null ? depth0.inheritedFrom : depth0), {"name":"with","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</p>\r\n";
},"2":function(depth0,helpers,partials,data) {
  var stack1;
  stack1 = this.invokePartial(partials.typeAndParent, '', 'typeAndParent', depth0, undefined, helpers, partials, data);
  if (stack1 != null) { return stack1; }
  else { return ''; }
  },"4":function(depth0,helpers,partials,data) {
  var stack1, buffer = "        <p>Overwrites ";
  stack1 = helpers['with'].call(depth0, (depth0 != null ? depth0.overwrites : depth0), {"name":"with","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</p>\r\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, buffer = "<aside class=\"tsd-sources\">\r\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.inheritedFrom : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.overwrites : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</aside>";
},"usePartial":true,"useData":true});