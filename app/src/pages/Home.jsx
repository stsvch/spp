import { formatDate, isToday } from "../utils/date.js";
import { generateId } from "../utils/id.js";
import { filterByStatus } from "../utils/tasks.js";

export default function Home() {
  const sampleTasks = [
    { id: generateId(), title: "Поднять проект",   status: "todo",        createdAt: new Date() },
    { id: generateId(), title: "Добавить Docker",  status: "in-progress", createdAt: new Date(Date.now() - 86400000) },
    { id: generateId(), title: "Настроить CI",     status: "done",        createdAt: new Date(Date.now() - 2 * 86400000) },
  ];

  const todo = filterByStatus(sampleTasks, "todo");
  const inProgress= filterByStatus(sampleTasks, "in-progress");
  const done = filterByStatus(sampleTasks, "done");

  const TaskCard = ({ task }) => (
    <div className="card">
      <div>{task.title}</div>
      <small>создана {formatDate(task.createdAt)}</small>
    </div>
  );

  return (
    <section>
      <h1>Главная</h1>
      <p>
        Сегодня {formatDate(new Date())} {isToday(new Date()) ? "(сегодня)" : ""}
      </p>

      <div className="board">
        <div className="column">
          <h3>К выполнению</h3>
          {todo.length ? (
            todo.map(t => <TaskCard key={t.id} task={t} />)
          ) : (
            <small>Нет задач</small>
          )}
        </div>

        <div className="column">
          <h3>В работе</h3>
          {inProgress.length ? (
            inProgress.map(t => <TaskCard key={t.id} task={t} />)
          ) : (
            <small>Нет задач</small>
          )}
        </div>

        <div className="column">
          <h3>Готово</h3>
          {done.length ? (
            done.map(t => <TaskCard key={t.id} task={t} />)
          ) : (
            <small>Нет задач</small>
          )}
        </div>
      </div>
    </section>
  );
}
