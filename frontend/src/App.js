import React, { Component } from 'react'
import axios from 'axios'

import EOSIOClient from 'utils/eosio-client'
import IOClient from 'utils/io-client'
import { updatePostsForCreateAndEdit, updatePostsForLike, updatePostsForDelete, updateAccounts } from 'utils/posts-updater'
import CreatePost from 'CreatePost/CreatePost'
import Posts from 'Posts/Posts'
import { Table } from 'reactstrap';

class App extends Component {
  state = {
    createOpen: false,
    posts: [],
    accounts: []
  }

  // Instantiate shared eosjs helper and socket io helper
  constructor (props) {
    super(props)
    const contractAccount = process.env.REACT_APP_EOSIO_CONTRACT_ACCOUNT
    this.eosio = new EOSIOClient(contractAccount)
    this.io = new IOClient()
  }

  // Enable Realtime updates via Socket.io
  async componentDidMount () {
    this.loadPosts()
    this.loadAccounts()
    this.io.onMessage('createpost', (post) => {
      this.setState((prevState) => ({ posts: updatePostsForCreateAndEdit(prevState, post) }))
    })
    this.io.onMessage('editpost', (post) => {
      this.setState((prevState) => ({ posts: updatePostsForCreateAndEdit(prevState, post) }))
    })
    this.io.onMessage('deletepost', (post) => {
      this.setState((prevState) => ({ posts: updatePostsForDelete(prevState, post) }))
    })
    this.io.onMessage('likepost', (post) => {
      this.setState((prevState) => ({ posts: updatePostsForLike(prevState, post) }))
    })
    this.io.onMessage('upsertbal', (post) => {
      this.setState((prevState) => ({ accounts: updateAccounts(prevState, post) }))
    })
  }

  // Load posts
  loadPosts = async () => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/posts/post`)
    this.setState({ posts: response.data.reverse() })
  }

  // Load accounts
  loadAccounts = async() => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/posts/account`)
    this.setState({ accounts: response.data.reverse() })
  }

  // Create a post
  createPost = async (post) => {
    try {
      const newPost = {
        ...post,
        _id: {
          timestamp: Math.floor(Date.now() / 1000),
          author: process.env.REACT_APP_EOSIO_ACCOUNT
        },
        author: process.env.REACT_APP_EOSIO_ACCOUNT
      }

      await this.eosio.transaction(
        process.env.REACT_APP_EOSIO_ACCOUNT,
        'createpost', {
          timestamp: newPost._id.timestamp,
          author: newPost._id.author,
          ...post
        }
      )
      this.setState((prevState) => ({ posts: updatePostsForCreateAndEdit(prevState, newPost) }))
      this.toggleCreate()
    } catch (err) {
      console.error(err)
    }
  }

  // Edit a post
  editPost = async (post) => {
    try {
      await this.eosio.transaction(
        process.env.REACT_APP_EOSIO_ACCOUNT,
        'editpost',
        {
          timestamp: post._id.timestamp,
          author: post._id.author,
          ...post
        }
      )
      this.setState((prevState) => ({ posts: updatePostsForCreateAndEdit(prevState, post) }))
    } catch (err) {
      console.error(err)
    }
  }

  // Delete a post
  deletePost = async (post) => {
    try {
      await this.eosio.transaction(
        process.env.REACT_APP_EOSIO_ACCOUNT,
        'deletepost',
        {
          timestamp: post._id.timestamp,
          author: post._id.author
        }
      )
      this.setState((prevState) => ({ posts: updatePostsForDelete(prevState, post) }))
    } catch (err) {
      console.error(err)
    }
  }

  // Like a post
  likePost = async (post) => {
    try {
      await this.eosio.transaction(
        process.env.REACT_APP_EOSIO_ACCOUNT,
        'likepost', {
          timestamp: post._id.timestamp,
          author: post._id.author
        }
      )
    } catch (err) {
      console.error(err)
    }
  }

  // upsertBal = async (post) => {
  //   try {
  //     await this.eosio.transaction(
  //       `calcaccount`,
  //       `upsertbal`, {
  //         account: process.env.REACT_APP_EOSIO_ACCOUNT,
  //         dob: ...
  //       }
  //     )
  //   } catch (err) {
  //     console.error(err);
  //   }
  // }

  // Toggle if create window is open
  toggleCreate = () => {
    this.setState(prevState => ({
      createOpen: !prevState.createOpen
    }))
  }

  render () {
    console.log(this.state.accounts);
    return (
      <div className={`layoutStandard ${this.state.createOpen ? 'createOpen' : ''}`}>
        <div className='logo'>EOSIO Starter</div>
        <div className='main'>
          <div className='toggleCreate' onClick={this.toggleCreate} />
          <CreatePost createPost={this.createPost} />
          <div className='cards'>
            <Posts
              posts={this.state.posts}
              handleOnChange={this.handleOnChange}
              deletePost={this.deletePost}
              editPost={this.editPost}
              likePost={this.likePost}
            />
          </div>
          <div style={{ padding: '20px' }}>
            <Table dark>
              <thead>
                <tr align='center'>
                  <th>#</th>
                  <th>Account Name</th>
                  <th>DOB (Epoch utc)</th>
                  <th>Balance (USD)</th>
                </tr>
              </thead>
              <tbody>
                {this.state.accounts ? this.state.accounts.map(account => (
                  <tr align='center'>
                    <th scope="row">-</th>
                    <td>{account.account}</td>
                    <td>{account.dob}</td>
                    <td>{account.balance}</td>
                  </tr>
                )) : null}
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    )
  }
}
App.displayName = 'App' // Tell React Dev Tools the component name

export default App
