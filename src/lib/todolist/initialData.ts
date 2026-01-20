export const INITIAL_DATA = {
  todos: [
    { id: "1", text: "Buy groceries", completed: false },
    { id: "2", text: "Finish project report", completed: true },
    { id: "3", text: "Call dentist", completed: false },
    { id: "4", text: "Review pull requests", completed: false },
    { id: "5", text: "Update documentation", completed: true },
  ],
  settings: {
    showCompleted: true,
    sortBy: "date",
  },
  form: {
    newTodo: "",
  },
};
