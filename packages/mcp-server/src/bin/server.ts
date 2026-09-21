#!/usr/bin/env node
import { MCPServer } from "../server.js";

const server = new MCPServer();
server.startStdio();
