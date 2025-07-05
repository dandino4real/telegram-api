

import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export const AuthController = {
  login: async (req: Request, res: Response): Promise<any> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const { id, accessToken, refreshToken } = await AuthService.login(email, password, req);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        message: "Login successful",
        accessToken,
        id
      });
    } catch (error: any) {
      return res.status(401).json({
        message: error.message || "Authentication failed",
      });
    }
  },

  logout: async (req: Request, res: Response): Promise<any> => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) return res.status(400).json({ message: "No token found" });

      await AuthService.logout(refreshToken);

      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return res.status(200).json({ message: "Logged out successfully" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Logout failed" });
    }
  },

  refresh: async (req: Request, res: Response): Promise<any> => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: "Missing refresh token" });
      }

      const accessToken = await AuthService.refreshAccessToken(refreshToken);

      return res.status(200).json({ accessToken });
    } catch (error: any) {
      return res.status(401).json({ message: error.message || "Invalid refresh token" });
    }
  },

  forgotPassword: async (req: Request, res: Response): Promise<any> => {
    try {
      const { email } = req.body;
      await AuthService.sendOTP(email);
      res.json({ message: "OTP sent to email" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  verifyOtp: async (req: Request, res: Response): Promise<any> => {
    try {
      const { email, otp } = req.body;
      await AuthService.verifyOTP(email, otp);
      res.json({ message: "OTP verified successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },

  resetPassword: async (req: Request, res: Response): Promise<any> => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) {
        return res.status(400).json({ message: "Email and new password are required" });
      }

      const result = await AuthService.resetPassword(email, newPassword);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  },
};