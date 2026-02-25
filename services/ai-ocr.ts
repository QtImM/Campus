// 假设后端运行在 8000 端口
const AI_BACKEND_URL = 'http://192.168.31.97:8000';

export interface ExtractedSchedule {
    course: string;
    room: string;
    time: string;
}

/**
 * 调用 FastAPI 后端提取课表信息 (Pytorch + Transformer)
 */
export const scanScheduleFromImage = async (imageUri: string): Promise<ExtractedSchedule> => {
    try {
        const formData = new FormData();
        // @ts-ignore
        formData.append('file', {
            uri: imageUri,
            name: 'schedule.jpg',
            type: 'image/jpeg',
        });

        const response = await fetch(`${AI_BACKEND_URL}/extract/schedule`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.ok) {
            throw new Error(`AI Backend Error: ${response.status}`);
        }

        const data = await response.json();

        // 返回真实的提取结果
        return data.extraction || {
            course: '未能识别',
            room: '未能识别',
            time: '未能识别'
        };
    } catch (error) {
        console.error('[AI Service] Scan failed:', error);
        throw error;
    }
};
