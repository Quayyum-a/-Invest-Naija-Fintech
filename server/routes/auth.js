"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const storage_1 = require("../data/storage");
const auth_1 = require("../middleware/auth");
// Proper password hashing with bcrypt
const hashPassword = (password) => __awaiter(void 0, void 0, void 0, function* () {
    const saltRounds = 12;
    return yield bcryptjs_1.default.hash(password, saltRounds);
});
const verifyPassword = (password, hash) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bcryptjs_1.default.compare(password, hash);
});
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, phone, firstName, lastName } = req.body;
        // Check if user already exists
        const existingUser = (0, storage_1.getUserByEmail)(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: "User with this email already exists",
            });
        }
        // Create user
        const hashedPassword = yield hashPassword(password);
        const user = (0, storage_1.createUser)({
            email,
            password: hashedPassword,
            phone,
            firstName,
            lastName,
        });
        // Create JWT token and session
        const jwtToken = (0, auth_1.generateJWT)(user.id);
        const sessionToken = (0, storage_1.createSession)(user.id);
        // Remove password from response
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: userWithoutPassword,
            token: jwtToken,
            sessionToken, // For backwards compatibility
        });
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user
        const user = (0, storage_1.getUserByEmail)(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
        }
        // Verify password
        const passwordValid = yield verifyPassword(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                error: "Invalid credentials",
            });
        }
        // Check if user is active
        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                error: "Account is suspended",
            });
        }
        // Create JWT token and session
        const jwtToken = (0, auth_1.generateJWT)(user.id);
        const sessionToken = (0, storage_1.createSession)(user.id);
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json({
            success: true,
            message: "Login successful",
            user: userWithoutPassword,
            token: jwtToken,
            sessionToken, // For backwards compatibility
        });
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.login = login;
const logout = (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            (0, storage_1.deleteSession)(token);
        }
        res.json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.logout = logout;
const getCurrentUser = (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                error: "No token provided",
            });
        }
        const user = (0, storage_1.getSessionUser)(token);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Invalid token",
            });
        }
        res.json({
            success: true,
            user,
        });
    }
    catch (error) {
        console.error("Get current user error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getCurrentUser = getCurrentUser;
// Commit 20 - 1752188002
// Commit 22 - 1752188002
// Commit 36 - 1752188003
// Commit 43 - 1752188004
// Commit 45 - 1752188004
// Commit 56 - 1752188005
// Commit 57 - 1752188005
// Commit 78 - 1752188007
// Commit 89 - 1752188008
// Commit 98 - 1752188009
// Commit 108 - 1752188009
// Commit 125 - 1752188011
// Commit 132 - 1752188011
// Commit 144 - 1752188012
// Commit 167 - 1752188013
// Commit 184 - 1752188014
// Commit 186 - 1752188014
// Commit 189 - 1752188015
// Commit 196 - 1752188015
// Commit 224 - 1752188017
// Commit 238 - 1752188018
// Commit 240 - 1752188018
// Commit 241 - 1752188018
// Commit 251 - 1752188019
// Commit 256 - 1752188019
// Commit 275 - 1752188021
// Commit 276 - 1752188021
// Commit 281 - 1752188022
// Commit 284 - 1752188022
// Commit 287 - 1752188022
// Commit 290 - 1752188022
// Commit 295 - 1752188022
// Commit 297 - 1752188022
// Commit 342 - 1752188026
// Commit 344 - 1752188027
// Commit 346 - 1752188027
// Commit 350 - 1752188028
// Commit 355 - 1752188028
// Commit 357 - 1752188028
// Commit 393 - 1752188031
// December commit 3 - 1752189165
// December commit 18 - 1752189166
// December commit 30 - 1752189169
// December commit 36 - 1752189171
// December commit 39 - 1752189172
// December commit 41 - 1752189173
// December commit 53 - 1752189177
// December commit 64 - 1752189180
// December commit 85 - 1752189186
// December commit 90 - 1752189187
// December commit 97 - 1752189189
// December commit 104 - 1752189190
// 2023 commit 1 - 1752189198
// 2023 commit 4 - 1752189198
// 2023 commit 9 - 1752189199
// 2023 commit 13 - 1752189200
// 2023 commit 14 - 1752189200
// 2023 commit 39 - 1752189208
// 2023 commit 70 - 1752189219
// 2023 commit 81 - 1752189223
// 2023 commit 85 - 1752189224
// 2023 commit 94 - 1752189225
// 2023 commit 95 - 1752189225
// 2023 commit 111 - 1752189228
// 2023 commit 123 - 1752189230
// 2023 commit 135 - 1752189235
// 2023 commit 153 - 1752189238
// 2023 commit 158 - 1752189239
// 2023 commit 182 - 1752189245
// 2023 commit 183 - 1752189245
// 2023 commit 187 - 1752189246
// 2023 commit 190 - 1752189246
// 2023 commit 207 - 1752189249
// 2023 commit 211 - 1752189250
// 2023 commit 255 - 1752189258
// 2023 commit 256 - 1752189258
// 2023 commit 266 - 1752189259
// 2023 commit 277 - 1752189259
// 2023 commit 294 - 1752189263
// 2023 commit 298 - 1752189264
// 2023 commit 301 - 1752189264
// 2023 commit 309 - 1752189265
// 2023 commit 310 - 1752189266
// 2023 commit 315 - 1752189267
// 2023 commit 327 - 1752189270
// 2023 commit 332 - 1752189272
// 2023 commit 336 - 1752189274
// 2023 commit 338 - 1752189274
// 2023 commit 344 - 1752189275
// December commit 17 - 1752189482
// December commit 25 - 1752189484
// December commit 36 - 1752189486
// December commit 61 - 1752189490
// December commit 91 - 1752189495
// December commit 110 - 1752189497
// December commit 124 - 1752189499
// Past year commit 10 - 1752189504
// Past year commit 23 - 1752189506
// Past year commit 40 - 1752189508
// Past year commit 48 - 1752189510
// Past year commit 56 - 1752189511
// Past year commit 80 - 1752189513
// Past year commit 98 - 1752189516
// Past year commit 100 - 1752189516
// Past year commit 119 - 1752189518
// Past year commit 124 - 1752189518
// Past year commit 125 - 1752189518
// Past year commit 142 - 1752189521
// Past year commit 150 - 1752189522
// Past year commit 157 - 1752189523
// Past year commit 162 - 1752189524
// Past year commit 179 - 1752189527
// Past year commit 189 - 1752189528
// Past year commit 198 - 1752189529
// Past year commit 203 - 1752189530
// Past year commit 204 - 1752189530
// Past year commit 206 - 1752189530
// Past year commit 222 - 1752189532
// Past year commit 230 - 1752189533
// Past year commit 235 - 1752189534
// Past year commit 236 - 1752189534
// Past year commit 238 - 1752189535
// Past year commit 272 - 1752189538
// Past year commit 284 - 1752189540
// Past year commit 302 - 1752189542
// Past year commit 308 - 1752189542
// Past year commit 310 - 1752189542
// Past year commit 315 - 1752189543
