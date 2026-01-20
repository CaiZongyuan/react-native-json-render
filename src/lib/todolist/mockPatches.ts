export const MOCK_PATCHES_TODOLIST = `
data:{"op":"set","path":"/root","value":"root"}

data:{"op":"add","path":"/elements/root","value":{"type":"Stack","props":{"gap":"md"},"children":["title","table","actions"]}}

data:{"op":"add","path":"/elements/title","value":{"type":"Title","props":{"text":"My Todo List"}}}

data:{"op":"add","path":"/elements/table","value":{"type":"Table","props":{"dataPath":"/todos"}}}

data:{"op":"add","path":"/elements/actions","value":{"type":"Stack","props":{"gap":"sm"},"children":["addBtn","clearBtn"]}}

data:{"op":"add","path":"/elements/addBtn","value":{"type":"Button","props":{"label":"Add Todo","variant":"primary","action":"addTodo"}}}

data:{"op":"add","path":"/elements/clearBtn","value":{"type":"Confirm","props":{"label":"Clear All","action":"clearAll","confirm":{"title":"Clear All Todos","message":"Are you sure you want to delete all todos?"}}}}
`.trim();
