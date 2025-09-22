# S.O.L.I.D. Principles in React

## S - Single Responsibility Principle (SRP)

_A component should do only one thing and do it well._

**❌ Bad - One component doing too much:**

```jsx
function UserCard({ userId }) {
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then(setUser)
  }, [userId])

  return user ? (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  ) : (
    <p>Loading...</p>
  )
}
```

**✅ Good - Separate concerns:**

```jsx
function useUser(userId) {
  const [user, setUser] = React.useState(null)
  React.useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then(setUser)
  }, [userId])
  return user
}

function UserCard({ user }) {
  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )
}

function UserCardContainer({ userId }) {
  const user = useUser(userId)
  return user ? <UserCard user={user} /> : <p>Loading...</p>
}
```

---

## O - Open/Closed Principle (OCP)

_Components should be open for extension, but closed for modification._

**❌ Bad - Editing component each time requirements change:**

```jsx
function Button({ type, children }) {
  if (type === "primary") return <button className="btn-primary">{children}</button>
  if (type === "secondary") return <button className="btn-secondary">{children}</button>
}
```

**✅ Good - Extend with props without changing the component:**

```jsx
function Button({ className, children, ...props }) {
  return (
    <button className={`btn ${className}`} {...props}>
      {children}
    </button>
  );
}

// Usage
<Button className="btn-primary">Save</Button>
<Button className="btn-secondary">Cancel</Button>
```

---

## L - Liskov Substitution Principle (LSP)

_You should be able to replace a component with a subtype without breaking things._

**Example - Both components work the same way:**

```jsx
function TextInput(props) {
  return <input type="text" {...props} />
}

function EmailInput(props) {
  return <input type="email" {...props} />
}

// Both can be used where an input is expected
function Form() {
  return (
    <>
      <TextInput placeholder="Name" />
      <EmailInput placeholder="Email" />
    </>
  )
}
```

---

## I - Interface Segregation Principle (ISP)

_Don’t force components to accept props they don’t need._

**❌ Bad - Component with too many props:**

```jsx
function UserProfile({ name, email, phone, address, company, website }) {
  return <div>{name}</div>
}
```

**✅ Good - Split into smaller components:**

```jsx
function UserName({ name }) {
  return <h3>{name}</h3>
}

function UserContact({ email, phone }) {
  return (
    <div>
      <p>{email}</p>
      <p>{phone}</p>
    </div>
  )
}
```

---

## D - Dependency Inversion Principle (DIP)

_Depend on abstractions, not on concrete implementations._

**❌ Bad - Component directly tied to a data source:**

```jsx
function UserList() {
  const [users, setUsers] = React.useState([])

  React.useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setUsers)
  }, [])

  return users.map((u) => <div key={u.id}>{u.name}</div>)
}
```

**✅ Good - Inject the data-fetching logic:**

```jsx
function UserList({ fetchUsers }) {
  const [users, setUsers] = React.useState([])

  React.useEffect(() => {
    fetchUsers().then(setUsers)
  }, [fetchUsers])

  return users.map((u) => <div key={u.id}>{u.name}</div>)
}

// Usage
;<UserList fetchUsers={() => fetch("/api/users").then((res) => res.json())} />
```

---

Do you want me to also make you a **minimal single-page cheatsheet version** so it’s easier to reference?
