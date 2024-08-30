"use client";

import React from 'react';
import { Container, Box, Typography, AppBar, Toolbar, Button } from '@mui/material';
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (<Container maxWidth="100vw">
    {/* <AppBar position="static" sx={{backgroundColor: '#3f51b5'}}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
          ERUDITESPARK AI
        </Typography>
        
            <Button color="inherit" component={Link} href="/sign-in">Log In</Button>
            
            <Button color="inherit" component={Link} href="/sign-up">Sign Up</Button> */}
          
     
        {/* <Button color="inherit">
          <Link href="/sign-in" passHref>
          Log In
          </Link>
        </Button> */}
  
        {/* <Button color="inherit">
          <Link href="/sign-up" passHref>
          Sign Up
          </Link>
        </Button> */}
      {/* </Toolbar> */}
    {/* <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{textAlign: 'center', my: 4}}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Sign In
      </Typography>
      <SignIn 
        path="/sign-in" 
        routing="path" 
        signUpUrl="/sign-up" 
      />
    </Box> */}
    {/* </AppBar> */}
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      sx={{textAlign: 'center', my: 4}}>
      <Typography variant="h4" component="h1" gutterBottom>
        <SignIn />
      </Typography>
      </Box>
   </Container>
)}