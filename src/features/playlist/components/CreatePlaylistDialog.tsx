import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X, Plus, Eye, EyeOff, Loader2 } from "@/components/Icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPlaylistSchema, type CreatePlaylistForm } from "../types/playlist";
import { databaseService } from "@/db/database-service";
import { type Playlist } from "@/db/schema";

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (playlist: Playlist) => void;
}

export function CreatePlaylistDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePlaylistDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPublicToggle, setShowPublicToggle] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger,
  } = useForm<CreatePlaylistForm>({
    resolver: zodResolver(createPlaylistSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
      tags: [],
    },
    mode: "onChange",
  });

  const watchedName = watch("name");
  const watchedIsPublic = watch("isPublic");

  // 重置表单状态
  useEffect(() => {
    if (open) {
      reset();
      setError(null);
      setIsSuccess(false);
      setShowPublicToggle(false);
    }
  }, [open, reset]);

  // 自动显示公开切换按钮
  useEffect(() => {
    if (watchedName && watchedName.length > 3) {
      setShowPublicToggle(true);
    } else {
      setShowPublicToggle(false);
      setValue("isPublic", false);
    }
  }, [watchedName, setValue]);

  const onSubmit = async (data: CreatePlaylistForm) => {
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      // 验证表单
      const isFormValid = await trigger();
      if (!isFormValid) {
        setError("请检查表单中的错误");
        return;
      }

      const playlist = await databaseService.createPlaylist({
        name: data.name.trim(),
        description: data.description?.trim() || null,
        isPublic: data.isPublic,
        tags: data.tags,
      });

      setIsSuccess(true);
      
      // 添加成功反馈动画
      setTimeout(() => {
        reset();
        setIsSuccess(false);
        onOpenChange(false);
        onSuccess?.(playlist);
      }, 1500); // 延长成功状态显示时间
    } catch (err: any) {
      console.error("创建播放列表失败:", err);
      
      // 更具体的错误处理
      if (err.message?.includes("UNIQUE constraint")) {
        setError("播放列表名称已存在，请使用其他名称");
      } else if (err.message?.includes("database")) {
        setError("数据库连接失败，请稍后重试");
      } else {
        setError("创建播放列表失败，请重试");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setError(null);
      setIsSuccess(false);
      onOpenChange(false);
    }
  };

  const togglePublic = () => {
    setValue("isPublic", !watchedIsPublic);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isSuccess ? (
              <>
                <Check className="w-5 h-5 text-green-600" />
                <Text className="text-green-600">创建成功</Text>
              </>
            ) : (
              <View className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <Text>创建播放列表</Text>
              </View>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSuccess 
              ? "播放列表已成功创建并准备使用" 
              : "创建一个新的播放列表来组织您的视频"
            }
          </DialogDescription>
        </DialogHeader>

        {!isSuccess && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <View className="flex items-center justify-between">
                <Text className="text-sm font-medium">播放列表名称 *</Text>
                {showPublicToggle && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onPress={togglePublic}
                    className="flex items-center gap-1"
                    disabled={isSubmitting}
                  >
                    {watchedIsPublic ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Text className="text-xs">
                      {watchedIsPublic ? "公开" : "私密"}
                    </Text>
                  </Button>
                )}
              </View>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Input
                    placeholder="输入播放列表名称"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      // 实时验证
                      trigger("name");
                    }}
                    editable={!isSubmitting}
                    className={errors.name ? "border-destructive" : ""}
                  />
                )}
              />
              {errors.name && (
                <Text className="text-sm text-destructive">{errors.name.message}</Text>
              )}
              {watchedName && watchedName.length > 0 && (
                <Text className="text-xs text-muted-foreground">
                  {watchedName.length}/50 字符
                </Text>
              )}
            </div>

            <div className="space-y-2">
              <View className="flex items-center justify-between">
                <Text className="text-sm font-medium">描述（可选）</Text>
                {watchedName && watchedName.length > 0 && (
                  <Text className="text-xs text-muted-foreground">
                    添加描述有助于识别播放列表
                  </Text>
                )}
              </View>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <Input
                    placeholder="输入播放列表描述"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      // 实时验证
                      trigger("description");
                    }}
                    editable={!isSubmitting}
                    multiline
                    numberOfLines={3}
                    className={errors.description ? "border-destructive" : ""}
                  />
                )}
              />
              {errors.description && (
                <Text className="text-sm text-destructive">{errors.description.message}</Text>
              )}
              {value && value.length > 0 && (
                <Text className="text-xs text-muted-foreground">
                  {value.length}/200 字符
                </Text>
              )}
            </div>

            {error && (
              <Text className="text-sm text-destructive text-center">{error}</Text>
            )}

            <DialogFooter className="flex flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onPress={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid || !watchedName}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    创建
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}

        {isSuccess && (
          <View className="flex items-center justify-center py-6">
            <View className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </View>
            <Text className="text-xl font-bold text-green-600 mb-2">
              播放列表创建成功！
            </Text>
            <Text className="text-muted-foreground text-center mb-4">
              您的播放列表 "{watchedName}" 已准备就绪
            </Text>
            <View className="flex items-center gap-2 text-sm text-muted-foreground">
              {watchedIsPublic ? (
                <>
                  <Eye className="w-4 h-4" />
                  <Text>公开播放列表</Text>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <Text>私密播放列表</Text>
                </>
              )}
            </View>
          </View>
        )}
      </DialogContent>
    </Dialog>
  );
}