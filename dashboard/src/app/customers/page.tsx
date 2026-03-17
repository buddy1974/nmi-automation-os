"use client"

import { useState } from "react"

type Customer = {
  id: number
  name: string
  phone: string
  address: string
}

export default function CustomersPage() {

  const [customers, setCustomers] = useState<Customer[]>([])

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")


  function addCustomer() {

    if (!name) return

    const newCustomer: Customer = {

      id: Date.now(),

      name,
      phone,
      address

    }

    setCustomers([...customers, newCustomer])

    setName("")
    setPhone("")
    setAddress("")

  }


  return (

    <div>

      <h1>Customers</h1>


      <h2>Add customer</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <input
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <button onClick={addCustomer}>
        Add
      </button>



      <h2>List</h2>

      {customers.map(c => (

        <div key={c.id}>

          {c.name} — {c.phone} — {c.address}

        </div>

      ))}


    </div>

  )

}
