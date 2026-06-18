import {Routes,Route,Link} from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'

function App(){
  return(
    <div className='min-h-screen bg-gray-50'>
      <nav className='bg-white border-b border-gray-200 px-6 py-4 flex gap-6'>
        <Link to="/" className='text-sm font-medium text-gray-900 hover:text-indigo-600'>Dashboard</Link>
        <Link to="/clients" className='text-sm font-medium text-gray-900 hover:text-indigo-600'>Clients</Link>
      </nav>
      <main className='p-6'>
        <Routes>
          <Route path='/' element={<Dashboard/>} />
          <Route path='/clients' element={<Clients/>} />
          <Route path='/clients/:apiKey' element={<ClientDetail/>} />
        </Routes>
      </main>
    </div>
  )
}

export default App